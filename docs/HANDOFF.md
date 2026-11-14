# Handoff: Reexa (Reply Student Tech Clash 2026, "AI on Campus")

Snapshot 2026-11-14 ~15:45. Code freeze ~17:00. Read `CONTEXT.md` (product, rules, demo path) first.

## What it is
Upload course slides → personal playlist of AI lecture videos (ManimGL animation + edge-tts voiceover + VTT
captions + transcript) and cited notes. A check after each lesson needs an answer **plus reasoning**; a wrong
answer gets a misconception diagnosis and a targeted 1-minute video, then a new re-check question.
Every generated item cites file+page and passes an AI jury before the student sees it.

## Live / repo
- Live: https://web-zeta-six-87.vercel.app (Vercel project `web`, team coding-rods-projects; public).
- Repo: https://github.com/Coding-Rod/Reply_Hackathon (private). Branch `main`.
- Local dev: `cd web && pnpm dev` (port 3000; a dev server may already run on 3123). Upload + live video
  render only work locally (`ALLOW_UPLOAD=1` in `.env.local`).

## Layout
- `web/`: Next.js 16 App Router + Tailwind v4. Key files:
  - `lib/llm.ts` OpenAI-compatible client (OpenRouter default; `LLM_BASE_URL` for Ollama), hourly call
    budget, AES-GCM `seal/unseal` (needs `RECHECK_SECRET` in prod).
  - `lib/armor.ts` prompt guard: Google Model Armor if `MODEL_ARMOR_*` set, else rules + LLM classifier.
  - `lib/profile.ts` profile contract + allowlists; `lib/store.ts` localStorage (progress, notes, profile,
    per-course settings, drafts); `lib/content.ts` manifest/section/explain readers.
  - API: `/api/profile/check`, `/api/upload` (local only), `/api/section/[l]/[s]` (answers stripped),
    `/api/diagnose`, `/api/explain`, `/api/manifest`. `proxy.ts` blocks direct `/content/**/*.json`.
  - Pages: `/` courses landing, `/course/[id]`, `/courses/new` (tabs: Course/Language/Materials/Review,
    autosaved draft), `/profile` (user only: account, preferences, tutor instructions, privacy),
    `/learn/[l]/[s]` player, `/dashboard`.
  - UI: `components/ui/tabs.tsx` (shadcn line tabs), palette in `app/globals.css` (navy #0F1D3A, teal
    #75FBF6 accent, purple glass cards), `app/manifest.ts` PWA.
- `worker/`: Python (conda env `3b1b`): `pipeline.py` (PDF → outline → script/notes/quiz → jury → TTS →
  ManimGL render → `web/public/content/`), `explain.py` (targeted mini-video, cached by hash), `scene.py`
  fixed visual templates, `tts.py` (edge-tts + `speakable()` cleaner), `llm.py` (stub mode `LLM_STUB=1`).
- `desktop/`: Electron shell. `pnpm start` = online URL; `pnpm local` = local Next on :3210 using Ollama.
- `scripts/`: `generate-course.sh` (real content), `setup-model-armor.sh` (needs personal GCP project).
- `specs/001-misconception-video-tutor/`: spec, plan, contracts (Spec Kit). Constitution:
  `.specify/memory/constitution.md`.

## Models / keys
- OpenRouter key from the event (in root `.env` and `.env.local`, gitignored; $10 cap, ~$1 spent). Its
  guardrail allows only Anthropic: generator `anthropic/claude-sonnet-5.5`, jury `anthropic/claude-haiku-5.5`.
  Vercel has `OPENROUTER_API_KEY`, `LLM_MODEL`, `JURY_MODEL`, `RECHECK_SECRET`.
- Firebase (Google sign-in only): code done (`lib/firebase.ts`, `components/AuthButton.tsx`), **waiting for
  the 4 web config values** `NEXT_PUBLIC_FIREBASE_{API_KEY,AUTH_DOMAIN,PROJECT_ID,APP_ID}` in `.env.local`
  and Vercel, then redeploy. Authorized domain must be `web-zeta-six-87.vercel.app` (not `vercel.app`).

## Content
Databases 2 (course id `db2`): `02-concurrency` s01, s02 and `03-triggers` s01, s02 (real, jury pass).
Demo mini-video: `02-concurrency/s02/explain/130bd8aac7da` (serial vs serializable, jury pass).

## UI i18n (done, uncommitted at handoff)
- Strings live in `web/lib/i18n/{en,it,es,fr,de,pt}.ts` (`en.ts` is the source of truth; others are typed
  `Dict`, so a missing key fails `tsc`). Server: `lib/lang.ts` `getLang/getT` (cookie `lang`, else
  Accept-Language, else en). Client: `components/Lang.tsx` (`LangProvider`, `useT`, `useSetLang`, header
  `LangMenu`). Interface language is a field in `/profile` Preferences (separate from lesson language).
- `cacheComponents` turned off in `next.config.ts` (root layout reads the cookie on every request).
- `app/download/page.tsx` (added separately) still has its own English strings; move them into the dicts.
- To ship: `cd web && pnpm lint && pnpm exec tsc --noEmit`, commit, `vercel deploy --prod`.

## Open items
1. Firebase config values (above).
2. Demo dry run (path in `CONTEXT.md` §8), pitch deck (G2), deliverables pack (G4).
3. Desktop local mode works but `qwen2.5-coder` is weak; `ollama pull qwen2.5:7b` and `REEXA_LOCAL_MODEL`.
4. Known limits: progress/notes are per browser (no per-user DB); server does not verify Firebase tokens.
