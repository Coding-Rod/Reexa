# Team context: AI on Campus · Reply Student Tech Clash 2026

Paste this file into your AI assistant (ChatGPT, Claude, Gemini, Cursor…) as the first message,
then add your own goal. Everything below is the shared truth for the team. Last updated 2026-11-14 14:20.

## 1. The event

- Reply Student Tech Clash 2026, theme **"AI on Campus"**: pick a real problem in how students
  learn, how teachers teach, or how learning is assessed, and build an AI-based solution.
  University admin/logistics problems are out of scope.
- **Level 1 (required):** problem + idea + 60-second pitch, no slides.
- **Level 2 (required):** a working AI agent that (1) uses real course material, (2) takes at least
  one action beyond chatting, (3) knows its limits (helps the student think, doesn't think for them).
- **Level 3 (optional bonus):** multi-agent system, knowledge graph, or launch campaign.
- **Scoring:** Creativity & Innovation 40% · Impact 20% · Technical 20% · Presentation 20%.
- **Judges ask at every level:** Is this new, or just faster? Does it help someone think, or think
  for them? Who benefits, and who is left out?
- **Presenting:** every team gives a 60-second pitch. The top 3 then give a slide talk of up to 5 minutes.
- **Hand-in:** the presentation (required) + materials (agent instructions and design notes,
  material and actions, example interactions including one where the agent holds its boundary,
  screenshots, optional demo video).
- **Code freeze: ~17:00 today.**

## 2. Our product

**One-liner:** Upload your course slides and get a personal playlist of AI lecture videos
(animation + voiceover + captions + transcript) and notes, all cited to the slide page. When you
get a check question wrong, the tutor finds *which idea* you misunderstood and makes a 1-minute
video about exactly that, then asks a new question to prove you got it.

**Course for the demo:** Politecnico di Milano **Databases 2**. The demo topic is concurrency
control (view- vs conflict-serializability, VSR/CSR).

**User flow**
1. `/start`: profile form with name (stays in the browser and never goes to the AI), course, exam
   date, level, **output language** (en/it/es/fr/de/pt), learning style, and free-text
   instructions. The instructions are checked by **Google Model Armor**; without it, a local guard
   runs instead.
2. Upload PDFs (local version only). The pipeline builds the playlist.
3. Player: video with captions, a transcript you can click to jump, **AI notes** with clickable
   slide-page citations, **My notes** (timestamped and saved in the browser only), and **Check**.
4. Check: pick an answer **and** write your reasoning (8+ words) before anything is revealed. Then
   you get a diagnosis of the misconception with citations, a **targeted mini-video**, and a
   re-check question. A correct re-check closes the concept.

**Trust and safety (our answer to "AI hallucinates")**
- **Grounded:** every claim cites file + page of the uploaded material (NotebookLM-style). If the
  material doesn't cover something, the tutor says so.
- **AI as jury:** a second model from a different family (`openai/gpt-5.5`) checks every generated
  item against its sources before the student sees it. It checks faithfulness, correctness, no
  answer leak, and language. A failed item is regenerated once; if it fails again it is withheld
  and flagged.
- **Prompt guard:** student instructions go through Model Armor or the local guard, are checked
  again on the server, and enter prompts only as fenced style hints.
- **No answer before an attempt.** Quiz answers never reach the browser. The video explains the
  concept, never the specific answer.
- **Privacy:** error history and notes stay on the student's device; the name is never sent.
- **Accessibility:** every video has narration and captions.

**Out of scope (vision slide only):** professor portal, timed exams, oral exam simulation,
full-curriculum overview, other courses.

## 3. Status

| Area | State |
|---|---|
| Live app | **https://web-zeta-six-87.vercel.app** (public; sample content; upload disabled online) |
| Repo | https://github.com/Coding-Rod/Reply_Hackathon (private: ask Rodri for access) |
| Web app (Next.js) | Done: library, `/start`, player, notes, check, diagnosis, targeted video |
| Video pipeline (Python) | Done: PDF → outline → script/notes/quiz → jury → voice + captions → ManimGL video |
| Real AI content | **Waiting for the OpenRouter key**; current content is hand-written sample (stub mode) |
| Model Armor | Code done; needs a personal GCP project (`scripts/setup-model-armor.sh`) |
| Demo video for the misconception | Pre-generated (58 s) |

## 4. Architecture (short)

- `web/`: Next.js 16 (App Router, TypeScript, Tailwind), deployed on Vercel. API routes:
  `/api/profile/check`, `/api/upload` (local only), `/api/section/[l]/[s]` (answers stripped),
  `/api/diagnose`, `/api/explain`.
- `worker/`: Python 3.12 (conda env `3b1b`). `pipeline.py` (full lecture), `explain.py` (targeted
  mini-video), `scene.py` (fixed ManimGL templates: title, bullets, formula, schedule, graph; the
  LLM fills in content but never writes code), `tts.py` (edge-tts voices per language, VTT
  captions).
- **LLM:** OpenRouter. Generator `anthropic/claude-sonnet-5.5`, jury `openai/gpt-5.5`.
- **Content:** `web/public/content/<lecture>/<section>/` holds video.mp4, captions.vtt and
  section.json. The JSON is blocked from direct download.
- **Specs:** `specs/001-misconception-video-tutor/` (spec, plan, contracts),
  `.specify/memory/constitution.md` (project rules), `docs/idea.md` (idea doc and pitch draft).

## 5. Rules for any AI helping us

1. Don't add features outside the core loop before the demo works end to end.
2. Never show answers before an attempt; videos explain concepts, not solutions.
3. Every generated claim needs a citation (file + page).
4. No secrets in chat or commits (API keys live in `.env.local`, which is gitignored).
5. Keep the name "Databases 2" and the real slide pages. Don't invent course content.
6. Code changes go through Rodri (he integrates and deploys).

## 6. Open goals (pick one, tell the team)

| # | Goal | Output | Suggested owner |
|---|---|---|---|
| G1 | **Final 60-second pitch** (problem → idea → impact), rehearsed out loud | text + timing | Pitch lead |
| G2 | **5-minute slide deck** (in case we reach the top 3): problem, idea, demo, how it works, trust, impact, vision | slides | Deck lead |
| G3 | **Demo script**: exact clicks, a real student mistake from a past DB2 exam, backup plan if the network fails | 1-page script | Demo lead |
| G4 | **Deliverables pack**: agent instructions and design notes, material and actions, 3–4 example interactions including the "just give me the answer" refusal, screenshots | doc + images | Docs lead |
| G5 | **Name + tagline** | 1 line | Everyone, 5 min |
| G6 | **Success measures + risks slide**: who benefits, who is left out, data ownership, offline, cost | 1 slide | Deck lead |
| G7 | (Bonus, Level 3) **Launch campaign**: name, tagline, channels (PoliMi student groups, course pages, WeBeep), timing (2 weeks before exams) | 1 slide | Anyone free |

## 7. Questions to ask your AI (starter prompts)

- "Using this context, write a 60-second pitch (about 150 words) that a non-technical judge can
  repeat in their own words. Lead with a real student moment in Databases 2."
- "Act as a skeptical Reply judge. Ask me the 10 hardest questions about this project and grade my
  answers against the three judging questions."
- "Write the 'who benefits / who is left out' analysis for this tool, with mitigations."
- "Draft 4 example interactions between a student and the tutor, including one where the student
  asks for the answer and the tutor refuses but still helps."
- "Outline a 5-minute, 6-slide deck for this project with a speaker note per slide."
- "Is this genuinely new or just faster? Give me the strongest argument for 'new', plus one weakness
  we should own on stage."
- "Propose a Level 3 launch campaign for PoliMi students: name, tagline, channels and timing."

## 8. Facts to keep consistent

- Course: Databases 2, Politecnico di Milano. Material: 9 slide decks, exercises, about 30 past
  exams (2022–2026).
- Demo misconception: "treating CSR (conflict-serializability) as the definition of
  serializability; a conflict cycle does not rule out VSR, because of blind writes", for example
  `r1(x) w2(x) w1(x) w3(x)`. Source: `02-Concurrency.pdf` pp. 34, 37, 41.
- Video length: 1–2.5 min per lecture section; about 1 min per targeted video.
- Rendering takes about 1.5–3× the video length, so the demo uses pre-generated videos.
