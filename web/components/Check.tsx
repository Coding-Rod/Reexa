"use client";
import { useState } from "react";
import { CitationChip, JuryBadge } from "@/components/Notes";
import { updateProgress, loadProfile } from "@/lib/store";
import type { DiagnoseResponse, Passage, PublicQuestion, PublicSection } from "@/lib/types";

const MIN_WORDS = 8;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export default function Check({ section, sectionKey }: { section: PublicSection; sectionKey: string }) {
  const [index, setIndex] = useState(0);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const q = section.quiz[index];

  if (!section.quiz.length) return <p className="text-sm text-muted">No check questions for this lesson.</p>;

  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        Question {index + 1} of {section.quiz.length}. Answer and explain your thinking: the tutor looks for the idea
        behind a mistake, not just the mistake.
      </p>
      <Question
        key={q.id}
        q={q}
        section={section}
        onResolved={(concept, ok) => {
          setClosed((c) => ({ ...c, [concept]: ok }));
          updateProgress(sectionKey, (p) => ({ ...p, concepts: { ...p.concepts, [concept]: ok ? "closed" : "gap" } }));
        }}
      />
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="text-accent underline disabled:opacity-40">
          Previous
        </button>
        <span className="text-muted">
          {Object.entries(closed).map(([c, ok]) => (
            <span key={c} className={`ml-1 rounded-full px-2 py-0.5 text-xs ${ok ? "bg-good/15 text-good" : "bg-warn/15 text-warn"}`}>
              {c}: {ok ? "closed" : "gap"}
            </span>
          ))}
        </span>
        <button
          onClick={() => setIndex((i) => Math.min(section.quiz.length - 1, i + 1))}
          disabled={index === section.quiz.length - 1}
          className="text-accent underline disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Question({
  q,
  section,
  onResolved,
  recheck = false,
}: {
  q: PublicQuestion;
  section: PublicSection;
  onResolved: (concept: string, closed: boolean) => void;
  recheck?: boolean;
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DiagnoseResponse | null>(null);
  const [refusal, setRefusal] = useState(false);
  const n = words(reasoning);
  const ready = chosen !== null && n >= MIN_WORDS && !busy && !result;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lectureId: section.lecture_id,
          sectionId: section.id,
          questionId: q.token ? undefined : q.id,
          token: q.token,
          chosenIndex: chosen,
          reasoning,
          language: loadProfile()?.language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResult(data);
      onResolved(data.concept, data.correct && !data.misconception);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={recheck ? "mt-4 rounded-xl border-2 border-accent/50 p-3" : ""}>
      {recheck && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">Re-check: same idea, new question</p>}
      <form onSubmit={submit}>
        <fieldset disabled={!!result || busy}>
          <legend className="mb-2 font-medium">{q.question}</legend>
          <div className="space-y-1.5">
            {q.options.map((opt, i) => {
              const mark = result && (i === result.correctIndex ? "correct" : i === chosen ? "wrong" : "");
              return (
                <label
                  key={i}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-sm ${
                    mark === "correct" ? "border-good" : mark === "wrong" ? "border-bad" : chosen === i ? "border-accent" : "border-border"
                  }`}
                >
                  <input type="radio" name={`q-${q.id}`} checked={chosen === i} onChange={() => setChosen(i)} className="mt-0.5" />
                  <span className="flex-1 font-mono">{opt}</span>
                  {mark === "correct" && <span className="text-good">✓</span>}
                  {mark === "wrong" && <span className="text-bad">✗</span>}
                </label>
              );
            })}
          </div>
          <label htmlFor={`r-${q.id}`} className="mb-1 mt-3 block text-sm font-medium">
            Why? Explain your reasoning in one sentence
          </label>
          <textarea
            id={`r-${q.id}`}
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            rows={2}
            placeholder="I think so because…"
            className="w-full rounded-lg border border-border bg-background p-2 text-sm"
            aria-describedby={`rc-${q.id}`}
          />
          <p id={`rc-${q.id}`} className="text-xs text-muted">
            {n < MIN_WORDS ? `${MIN_WORDS - n} more word${MIN_WORDS - n === 1 ? "" : "s"} needed` : "Ready"}
          </p>
        </fieldset>
        {!result && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={!ready} className="rounded-lg bg-accent px-3 py-1.5 text-sm text-accent-fg disabled:opacity-40">
              {busy ? "Checking your reasoning…" : "Submit"}
            </button>
            <button type="button" onClick={() => setRefusal(true)} className="text-xs text-muted underline">
              Just show me the answer
            </button>
          </div>
        )}
        {refusal && !result && (
          <p role="status" className="mt-2 rounded-lg bg-background p-2 text-sm">
            I won&apos;t show the answer before you try: guessing and explaining is how you find what&apos;s missing. Pick
            the option you lean towards and say why, even if unsure. I&apos;ll show you exactly where the reasoning breaks.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-bad">
            {error}
          </p>
        )}
      </form>

      {result && <Feedback result={result} passages={section.passages} />}
      {result?.recheck && <Question q={result.recheck} section={section} onResolved={onResolved} recheck />}
    </div>
  );
}

function Feedback({ result, passages }: { result: DiagnoseResponse; passages: Passage[] }) {
  const solid = result.correct && !result.misconception;
  return (
    <div role="status" className="mt-3 space-y-2 rounded-lg bg-background p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`font-semibold ${solid ? "text-good" : result.correct ? "text-warn" : "text-bad"}`}>
          {solid ? "Correct, and your reasoning holds." : result.correct ? "Right answer, but the reasoning has a gap." : "Not quite."}
        </p>
        <JuryBadge jury={result.jury} />
      </div>
      {result.misconception && (
        <div className="rounded-md border-l-4 border-warn pl-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-warn">What went wrong in the reasoning</p>
          <p>{result.misconception}</p>
        </div>
      )}
      <p>{result.explanation}</p>
      {result.citations.length > 0 && (
        <p className="text-xs text-muted">
          Sources:{" "}
          {result.citations.map((c, i) => (
            <CitationChip key={i} c={c} passages={passages} />
          ))}
        </p>
      )}
      {solid && <p className="text-good">Concept closed ✓</p>}
    </div>
  );
}
