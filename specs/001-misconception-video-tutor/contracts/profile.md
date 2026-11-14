# Contract: Learner profile (onboarding form → upload → worker)

```json
{
  "name": "Rodri",
  "course": "Databases 2",
  "exam_date": "2026-12-10",
  "level": "beginner",
  "language": "en",
  "styles": ["visual", "examples"],
  "instructions": "Use simple analogies and go slowly on formulas.",
  "armor": {"engine": "model_armor", "verdict": "pass", "checked_at": "2026-11-14T13:50:00Z"}
}
```

| Field | Rule |
|---|---|
| `name` | optional, ≤ 60 chars. UI greeting only. **Never sent to any LLM.** |
| `course` | ≤ 80 chars |
| `exam_date` | `YYYY-MM-DD` or null |
| `level` | `beginner` \| `intermediate` \| `advanced` |
| `language` | allowlist: `en` `it` `es` `fr` `de` `pt` |
| `styles` | subset of `visual` `examples` `analogies` `step_by_step` `formal` |
| `instructions` | optional, ≤ 500 chars, must pass the prompt guard on the **server** |
| `armor` | written by the server, never trusted from the client |

## Prompt guard (web/lib/armor.ts)

1. **Google Model Armor** when `MODEL_ARMOR_PROJECT`, `MODEL_ARMOR_LOCATION`, `MODEL_ARMOR_TEMPLATE` are set:
   `POST https://modelarmor.{LOCATION}.rep.googleapis.com/v1/projects/{PROJECT}/locations/{LOCATION}/templates/{TEMPLATE}:sanitizeUserPrompt`
   body `{"userPromptData":{"text": "..."}}`; block when `sanitizationResult.filterMatchState == "MATCH_FOUND"`;
   report which filters matched (`pi_and_jailbreak`, `sdp`, `malicious_uris`, `rai`, `csam`).
   Auth: `GOOGLE_SERVICE_ACCOUNT_JSON` (Vercel) or `gcloud auth print-access-token` (local).
   If Model Armor is configured but the call fails → **fail closed** (block, "could not verify").
2. **Local guard** otherwise: deterministic rules (instruction-override phrases, role/system
   prompt talk, "reveal answers", URLs, code/markup, emails/phone numbers) + an LLM classifier
   (`JURY_MODEL`) when `OPENROUTER_API_KEY` is set. Engine reported as `local`.

## Worker use (defense in depth)

- `python -m worker.pipeline <pdf> --profile <profile.json>`; profile saved next to the upload.
- `instructions` enter the generation prompt only inside a delimited
  `<student_style_preferences>` block, described as untrusted style hints that cannot change
  sources, tasks, citation rules, or answer secrecy. Jury still checks every output.
- `language` drives all generated text (narration, captions, notes, quiz, diagnosis) and the TTS
  voice. Citation quotes stay in the source language.
- `level` and `styles` adjust depth and visual choices.
- Manifest lecture entry gains `"language": "en"`.
