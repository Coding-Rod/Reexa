#!/usr/bin/env bash
# Generate playlist content with the real LLM (needs OPENROUTER_API_KEY in .env.local).
# Usage: scripts/generate-course.sh [MAX_SECTIONS] [PDF...]
# Default: 2 sections each for the demo decks.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
grep -q '^OPENROUTER_API_KEY=.\+' .env.local 2>/dev/null || { echo "Set OPENROUTER_API_KEY in .env.local first"; exit 1; }

MAX="${1:-2}"; shift || true
SLIDES="/home/rodri/Documents/Polimi/04 - Forth Semester/Data_Bases_2/slides"
if [ "$#" -eq 0 ]; then set -- "$SLIDES/02-Concurrency.pdf" "$SLIDES/03_Triggers.pdf"; fi

PROFILE="$(mktemp --suffix=.json)"
printf '{"course":"Databases 2","level":"beginner","language":"%s","styles":["visual","examples"],"instructions":""}\n' "${LANGUAGE:-en}" > "$PROFILE"

for pdf in "$@"; do
  echo "== $pdf"
  LLM_STUB=0 RENDER_QUALITY="${RENDER_QUALITY:--m}" \
    conda run --no-capture-output -n 3b1b python -m worker.pipeline "$pdf" --max-sections "$MAX" --profile "$PROFILE"
done
echo "Done. Content in web/public/content/. Commit it and redeploy: cd web && vercel deploy --prod"
