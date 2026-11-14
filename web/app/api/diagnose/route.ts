import { isId, publicQuestion, readSection } from "@/lib/content";
import { chatJSON, JURY_MODEL, LLM_MODEL, llmEnabled, seal, unseal } from "@/lib/llm";
import type { Citation, DiagnoseRequest, DiagnoseResponse, Jury, QuizItem, Section } from "@/lib/types";

const MIN_WORDS = 8;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

type Sealed = QuizItem & { lectureId: string; sectionId: string };
type Generated = {
  misconception: string | null;
  explanation: string;
  citations: Citation[];
  recheck: Omit<QuizItem, "id" | "concept">;
};

export async function POST(req: Request) {
  let body: DiagnoseRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { lectureId, sectionId, questionId, token, chosenIndex } = body;
  const reasoning = typeof body.reasoning === "string" ? body.reasoning.slice(0, 1000) : "";
  if (!isId(lectureId) || !isId(sectionId) || !Number.isInteger(chosenIndex))
    return Response.json({ error: "Invalid request" }, { status: 400 });
  if (words(reasoning) < MIN_WORDS)
    return Response.json({ error: `Explain your reasoning in at least ${MIN_WORDS} words.` }, { status: 400 });

  const section = await readSection(lectureId, sectionId);
  if (!section) return Response.json({ error: "Section not found" }, { status: 404 });

  let q: QuizItem | undefined;
  if (token) {
    const s = unseal<Sealed>(token);
    if (s && s.lectureId === lectureId && s.sectionId === sectionId) q = s;
  } else if (isId(questionId)) {
    q = section.quiz.find((x) => x.id === questionId);
  }
  if (!q) return Response.json({ error: "Question not found" }, { status: 404 });
  if (chosenIndex < 0 || chosenIndex >= q.options.length)
    return Response.json({ error: "Invalid option" }, { status: 400 });

  const correct = chosenIndex === q.answer_index;

  if (llmEnabled()) {
    try {
      const out = await generateWithJury(section, q, chosenIndex, reasoning, correct);
      if (out) return Response.json(out);
    } catch (e) {
      console.error("diagnose: LLM path failed, using stored content", e);
    }
  }
  return Response.json(stub(section, q, chosenIndex, correct));
}

// Stored, jury-checked content when no key / LLM_STUB=1 / LLM failure.
function stub(section: Section, q: QuizItem, chosen: number, correct: boolean): DiagnoseResponse {
  const next =
    section.quiz.find((x) => x.concept === q.concept && x.id !== q.id && x.question !== q.question) ??
    section.quiz.find((x) => x.id !== q.id && x.question !== q.question);
  return {
    correct,
    correctIndex: q.answer_index,
    concept: q.concept,
    misconception: correct
      ? null
      : `You chose "${q.options[chosen]}", which does not match how the course defines "${q.concept}". Compare your reasoning with the cited slide.`,
    explanation: q.explanation,
    citations: q.citations,
    jury: { ...section.jury, reason: `Stored content. ${section.jury.reason}` },
    recheck: correct || !next ? null : publicQuestion(next),
    source: "stub",
  };
}

async function generateWithJury(
  section: Section,
  q: QuizItem,
  chosen: number,
  reasoning: string,
  correct: boolean,
): Promise<DiagnoseResponse | null> {
  const sources = section.passages.map((p, i) => `[${i + 1}] ${p.file} p.${p.page}\n${p.text}`).join("\n\n");
  const task = {
    question: q.question,
    options: q.options,
    correct_index: q.answer_index,
    student_choice_index: chosen,
    student_reasoning: reasoning,
    concept: q.concept,
  };
  let lastReason = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    const gen = await chatJSON<Generated>(LLM_MODEL, [
      {
        role: "system",
        content:
          "You are a Databases 2 tutor at Politecnico di Milano. Use ONLY the numbered course passages; never use outside knowledge. " +
          "Diagnose the specific misconception in the student's reasoning (the broken idea, not just 'wrong answer'). " +
          "If both the answer and the reasoning are sound, misconception is null. " +
          "Explain the concept in 2-4 sentences so the student understands why. " +
          "Write ONE new multiple-choice re-check question (4 options) on the same concept that differs from the original and whose answer is not stated in your explanation. " +
          "Every citation must quote text that appears verbatim in the cited passage. " +
          'Return JSON: {"misconception": string|null, "explanation": string, "citations": [{"file","page","quote"}], ' +
          '"recheck": {"question": string, "options": [4 strings], "answer_index": number, "explanation": string, "citations": [{"file","page","quote"}]}}' +
          (lastReason ? `\nA reviewer rejected your previous attempt: ${lastReason}` : ""),
      },
      { role: "user", content: `COURSE PASSAGES:\n${sources}\n\nTASK:\n${JSON.stringify(task)}` },
    ]);

    const known = (c: Citation) => section.passages.some((p) => p.file === c.file && Number(p.page) === Number(c.page));
    gen.citations = (gen.citations ?? []).filter(known);
    const recheckCites = (gen.recheck?.citations ?? []).filter(known);
    if (!gen.citations.length || !gen.recheck?.options?.length || !Number.isInteger(gen.recheck.answer_index)) {
      lastReason = "Missing citations to the provided passages or malformed re-check question.";
      continue;
    }

    const verdict = await chatJSON<{ pass: boolean; reason: string }>(JURY_MODEL, [
      {
        role: "system",
        content:
          "You are an independent reviewer (AI jury) for a study tool. Check the generated item ONLY against the course passages. " +
          "FAIL if: any claim is not supported by the passages; a quote does not appear in its cited passage; the diagnosis does not match the student's reasoning; " +
          "the re-check question's marked answer is wrong or not unique; or the explanation gives away the re-check answer. " +
          'Return JSON: {"pass": boolean, "reason": string (one sentence)}',
      },
      {
        role: "user",
        content: `COURSE PASSAGES:\n${sources}\n\nORIGINAL TASK:\n${JSON.stringify(task)}\n\nGENERATED ITEM:\n${JSON.stringify(gen)}`,
      },
    ]);

    if (verdict.pass) {
      const jury: Jury = { verdict: "pass", reason: verdict.reason, model: JURY_MODEL, attempts: attempt };
      const needsRecheck = !correct || gen.misconception !== null;
      const recheck: Sealed = {
        ...gen.recheck,
        citations: recheckCites,
        id: `r${Date.now()}`,
        concept: q.concept,
        lectureId: section.lecture_id,
        sectionId: section.id,
      };
      return {
        correct,
        correctIndex: q.answer_index,
        concept: q.concept,
        misconception: gen.misconception,
        explanation: gen.explanation,
        citations: gen.citations,
        jury,
        recheck: needsRecheck ? { ...publicQuestion(recheck), token: seal(recheck) } : null,
        source: "llm",
      };
    }
    lastReason = verdict.reason;
  }

  // Rejected twice: withhold generated content, flag it, fall back to stored content.
  console.warn("diagnose: jury rejected twice:", lastReason);
  const fallback = stub(section, q, chosen, correct);
  return {
    ...fallback,
    jury: { verdict: "flagged", reason: `Generated diagnosis withheld by the AI jury: ${lastReason}`, model: JURY_MODEL, attempts: 2 },
  };
}
