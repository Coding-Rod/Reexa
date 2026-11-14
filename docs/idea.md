# Idea Document: Misconception-to-Video Tutor

*AI on Campus · Reply Student Tech Clash 2026 · Draft for team review*

## One-liner

A tutor that finds **what you misunderstood**, not just what you got wrong, and shows it to you as a short narrated animation built from your own course material, then makes you prove you got it.

## Problem

In Databases 2 at PoliMi, students prepare from dense slides and about 30 past exams. When they get an exercise wrong, the solution sheet tells them *that* they are wrong, not *which idea* is broken. Generic AI chat makes it worse: it hands over the answer, the student copies it, and the misconception survives until the exam.

Three things are missing:
1. **Diagnosis:** nobody tells the student *why* their reasoning failed.
2. **A different explanation:** if the slides didn't work the first time, rereading them won't either. Visual learners have no way to *see* concepts like schedules, conflicts or locks.
3. **Proof of understanding:** students move on without checking that the gap is closed.

## Who and when

A PoliMi Databases 2 student studying alone in the two weeks before the exam, often at night, with nobody available to explain it differently.

## Use scenario

1. Rodri opens the topic map. "Concurrency control: VSR / CSR" is tagged **high importance** because it appeared in most of the past exams.
2. He takes a 5-question check. On question 3 he answers that a schedule is *not* view-serializable, and writes his reasoning: "it has a conflict cycle, so it can't be serializable."
3. The tutor diagnoses the misconception: **"You are treating conflict-serializability (CSR) as the definition of serializability. CSR is only a sufficient condition: a schedule with blind writes can be VSR without being CSR."** It cites the source: *Slides, Concurrency Control, p. 34.*
4. It generates a 60-second narrated, captioned animation. Two transactions appear as timelines, the conflict graph builds up, and a blind write shows why the cycle does not rule out view-equivalence. The video explains the concept, not the answer to question 3.
5. It asks a new question on the same concept. Rodri answers correctly and explains why. The concept turns **closed** on his map.

## Solution in plain language

Answer, explain your reasoning, get a diagnosis of the broken idea, watch a short visual explanation made for that idea, and prove it with a new question.

## What the agent does (beyond replying)

- Generates and scores the check questions, from the course material and past exams.
- Diagnoses the misconception behind a wrong answer, or behind a right answer with wrong reasoning.
- Generates a targeted animated video with voiceover and captions.
- Tracks per-concept progress for the student: not started, gap, closed.
- Ranks topics by how often they appeared in past exams.

## Limits: helps you think, doesn't think for you

- It never reveals an answer before the student has answered **and** explained their reasoning.
- The video explains the **concept**, never the solution to the specific question.
- A gap closes only when the student solves a **new** question on their own.
- If the student asks "just give me the answer", it declines and offers a hint or the video instead.

## Why AI is needed

Without AI you could have a fixed video library, but not a video for *your* misconception, generated on demand from *your* course's material. Reading the reasoning behind a wrong answer and naming the broken idea also requires language understanding. This is not "faster studying": it is an explanation that didn't exist before you made the mistake.

## Trust: handling hallucinations and source mismatch

This is the biggest risk of AI study tools, and we handle it in two layers:

1. **Grounded in indexed sources (NotebookLM-style).** All course files (slides, exercises, past exams) are indexed by file and page. Every diagnosis, question and video script is built from retrieved passages and shows its citation, for example *"Slides, Concurrency Control, p. 34"*. One click opens the original passage. If the material doesn't cover something, the tutor says so instead of inventing an answer.
2. **AI as jury.** Before anything reaches the student, an independent AI reviewer checks it against the cited passages: is it correct, is it faithful to the source, does it leak the answer? A failed item is regenerated once. If it fails again it is withheld and flagged. In the demo we can show the jury's verdict and reason.

## Other risks, and who might be left out

| Risk | Mitigation |
|---|---|
| Wrong maths or logic in a generated video | Grounding + jury; fixed visual templates (timelines, conflict graphs, lock tables) instead of free-form animation |
| Tool down the night before the exam | Generated videos and questions are cached and work offline |
| Student data | Error history stays on the student's device; nothing is shared with lecturers unless the student opts in |
| Course material copyright | Only material the student or lecturer provides is used |
| Hearing or bandwidth limits | Every video has narration **and** captions; captions and stills work on low bandwidth |
| Students without a powerful laptop | Videos are rendered server-side, so the student only streams them |
| Students who learn better by reading | The cited text explanation is always available next to the video |

## Success measures

- Re-check accuracy on the diagnosed concept rises compared with the first attempt (target: 70% or more correct after the video).
- From mistake to targeted explanation in under 2 minutes.
- Students rate "I now understand why I was wrong" at 4/5 or higher.
- 100% of displayed content carries a working citation.

## Scope for today

| Must have (demo) | Nice to have | Vision slide only |
|---|---|---|
| Databases 2, one topic (concurrency control: VSR/CSR) | Topic map with past-exam importance tags | Professor portal |
| 5-question check with mandatory reasoning | More topics (2PL, timestamps, triggers) | Personal notes |
| Misconception diagnosis with citations | Jury log view | Timed exam |
| One generated targeted video (voice + captions) | | Full curriculum overview |
| Re-check question and progress update | | Other courses |
| AI jury on every generated item | | |
| Cached fallback for every live step | | |

Oral exam simulation is dropped.

## Level 2 deliverables (coding path)

- [ ] Agent instructions/configuration and a note on key design choices
- [ ] Material used (Databases 2 slides, exercises, past exams) and actions (quiz, diagnosis, video, progress)
- [ ] Example interactions, including the "just give me the answer" boundary
- [ ] Screenshots of the setup and workflow
- [ ] Demo video (optional)

## Draft 60-second pitch

> "You got it wrong. The solution sheet says so. But *why* did you get it wrong?
> In Databases 2, students study from dense slides and 30 past exams, and they only find out at the exam which idea was broken. ChatGPT gives you the answer, not the understanding.
> Our tutor reads your reasoning, finds the exact misconception, and in under a minute generates a short animated explanation of that idea, built from your course's own slides and cited page by page. A second AI checks every word against the source before you see it. Then you prove you got it with a new question. It never gives you the answer.
> For students studying alone the night before an exam, it's the explanation nobody was there to give."

## Open questions for the team

1. **Name:** Rewind? SeeIt? Something else?
2. **Demo story:** whose real mistake do we use? Ideally one of you, on a real past-exam question.
3. **Who presents the 60-second pitch, and who drives the demo?**
4. **When is "end of work" today?** We need the exact time to size the build.
