# Plan: Lecture Playlist + Misconception Loop (draft build, code freeze ~17:00)

## Product (draft)

1. Student uploads lecture PDFs (Databases 2 slides).
2. Pipeline builds a **personal playlist**: per lecture, 3–6 sections; each section has an AI
   **video** (Manim animation + voiceover + captions + transcript) and **AI notes**, all cited
   (file + page) and checked by an AI jury.
3. Player page: video with captions, live transcript (click to seek), AI notes, **student notes**
   next to the video (timestamped, saved in the browser only).
4. After each section: short **check** (MCQ + mandatory one-sentence reasoning) → wrong answer →
   **diagnosis** of the misconception (cited, jury-checked) → re-check question. Targeted
   mini-video is a stretch goal (local only, cached fallback).

## Stack

| Part | Choice | Why |
|---|---|---|
| Web | Next.js (App Router, TS, Tailwind), `web/` | Same as ds_live; deploys to Vercel |
| Pipeline | Python 3.12 in conda env `3b1b`, `worker/` | ManimGL + LaTeX + TTS need a real machine |
| LLM | OpenRouter (OpenAI-compatible HTTP), `OPENROUTER_API_KEY` | One key, any model |
| Generator model | `anthropic/claude-sonnet-5.5` (`LLM_MODEL`) | Quality writing + JSON |
| Jury model | `openai/gpt-5.5` (`JURY_MODEL`) | Different family = independent check |
| TTS + captions | `edge-tts` (word boundaries → VTT) | No model download; good voices |
| Video | ManimGL **fixed visual templates** driven by JSON beats | No LLM-written code at render time = no broken renders |
| PDF | `pdftotext -layout -f N -l N` per page | Page-exact citations |
| Hosting | Local (upload + render) + Vercel (UI + pre-generated content) | Judges get a link; demo works offline |

`LLM_STUB=1` returns canned JSON so everything runs before the key arrives.

## Content contract (worker writes, web reads)

Root: `web/public/content/`

`manifest.json`
```json
{
  "course": {"id": "db2", "title": "Databases 2"},
  "lectures": [
    {"id": "02-concurrency", "title": "Concurrency Control", "source": "02-Concurrency.pdf",
     "status": "ready",
     "sections": [{"id": "s01", "title": "Schedules and anomalies", "duration": 74.2,
                   "path": "02-concurrency/s01"}]}
  ]
}
```
`status`: `processing` | `ready` | `failed`.

**Multi-course (backward compatible):** manifest also has `courses: [{id, title, term?, description?}]`
and each lecture has `course_id`. Readers (`web/lib/content.ts normalizeManifest`, `worker/pipeline.py
load_manifest`) fill both from the legacy single `course` field when missing. A new upload's course
comes from the profile `course`: reuse the course with the same title (case-insensitive), else
`id = slug(title)` (lowercase, non-alnum → `-`, max 40). Pages: `/` courses, `/course/[id]` library.

`<lecture>/<section>/section.json`
```json
{
  "id": "s01", "lecture_id": "02-concurrency", "title": "Schedules and anomalies",
  "video": "/content/02-concurrency/s01/video.mp4",
  "captions": "/content/02-concurrency/s01/captions.vtt",
  "duration": 74.2,
  "transcript": [{"start": 0.0, "end": 6.1, "text": "A schedule is ..."}],
  "notes_md": "## Key ideas\n- ... [02-Concurrency.pdf p.5]",
  "citations": [{"file": "02-Concurrency.pdf", "page": 5, "quote": "..."}],
  "passages": [{"file": "02-Concurrency.pdf", "page": 5, "text": "full page text"}],
  "jury": {"verdict": "pass", "reason": "...", "model": "openai/gpt-5.5", "attempts": 1},
  "quiz": [{"id": "q1", "concept": "conflict", "question": "...", "options": ["..."],
            "answer_index": 2, "explanation": "...",
            "citations": [{"file": "02-Concurrency.pdf", "page": 7, "quote": "..."}]}]
}
```
`jury.verdict`: `pass` | `flagged` (failed twice; UI shows a warning badge).

## Video beats (worker internal)

LLM returns `beats[]`: `{narration, visual}` where `visual.type` is one of
`title` · `bullets` · `formula` (LaTeX) · `schedule` (transactions as timelines with ops like
`r1(x)`, `w2(y)`) · `graph` (nodes + directed edges, e.g. conflict/precedence graph).
Each beat's duration = its TTS audio length; Manim scene waits per beat; ffmpeg muxes audio.

## Web API routes

- `POST /api/upload` (local only, `ALLOW_UPLOAD=1`): save PDF to `worker/inbox/`, spawn pipeline.
- `POST /api/diagnose` `{lectureId, sectionId, questionId, chosenIndex, reasoning}` →
  `{correct, misconception, explanation, citations, jury, recheck}`. Answer never sent to the
  client before submit (quiz served without `answer_index`/`explanation`).

## Parallel work

- Agent A: `worker/` pipeline (ingest → outline → script+notes+quiz → jury → TTS → render → write).
- Agent B: `web/` app against this contract, using a hand-made sample section.
- Main session: contract, integration, deploy, README.
