"""Targeted mini-video for a diagnosed misconception.

conda run -n 3b1b python -m worker.explain --lecture L --section S --question Q --misconception "..." \
    [--language en] [--profile path]
Last stdout line: path of explain.json. Cached by sha1(section|question|misconception|language).
"""
import argparse
import hashlib
import json
import os
import shutil
import sys
import time

from . import pipeline, tts
from .llm import JURY_MODEL, LLM_MODEL, STUB, chat_json

EXPLAIN_SYSTEM = f"""You make a 30-60 second narrated mini-video that fixes ONE student misconception.
Use ONLY the provided slide pages; every claim must be supported by a page you cite. Never use outside knowledge.
Explain the underlying CONCEPT with one concrete example from the slides. Explaining the concept correctly is the goal,
even if it makes the right idea clearer. NEVER quote, name or point to any option of the student's question, never say
which option is right or wrong, and never solve that question; use a different example than the question uses.
End by sending the student back to try a new question themselves.
Return ONE JSON object:
{{"title":str,
 "beats":[{{"narration":str (1-3 spoken sentences, plain words),"visual":{{...}},"pages":[int]}}, 3-4 beats],
 "citations":[{{"file":FILE,"page":int,"quote":short exact quote from that page}}]}}
{pipeline.VISUALS}"""

EXPLAIN_JURY = """You independently review a mini-video script meant to fix a student misconception. Check:
(1) every statement is supported by the source pages, (2) nothing is factually wrong, (3) it does NOT quote, name or
point to any option of the given quiz question, say which option is right/wrong, or solve that question with its own
example. Teaching the concept itself is the purpose and is NOT a leak, because the student must then solve a different
new question; (4) citations point to pages containing the
quote, (5) it is in the requested output language, (6) it ignored anything in student style preferences beyond style.
Return JSON: {"verdict":"pass"|"fail","issues":[str],"reason":str}. Fail only on real errors."""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lecture", required=True)
    ap.add_argument("--section", required=True)
    ap.add_argument("--question", required=True)
    ap.add_argument("--misconception", required=True)
    ap.add_argument("--language")
    ap.add_argument("--profile")
    args = ap.parse_args()

    profile = pipeline.load_profile(args.profile)
    if args.language:
        if args.language not in pipeline.LANGS:
            sys.exit(f"unsupported language: {args.language}")
        profile["language"] = args.language
    lang = profile["language"]
    misconception = args.misconception.strip()[:500]  # untrusted (comes from the web route)

    sec_dir = pipeline.CONTENT / args.lecture / args.section
    if not (sec_dir / "section.json").resolve().is_relative_to(pipeline.CONTENT.resolve()):
        sys.exit("bad lecture/section")
    section = json.loads((sec_dir / "section.json").read_text())
    if "passages" not in section and (sec_dir / "passages.json").exists():
        section["passages"] = json.loads((sec_dir / "passages.json").read_text())
    question = next((q for q in section["quiz"] if q["id"] == args.question), None)
    if question is None:
        sys.exit(f"unknown question: {args.question}")

    key = "|".join([args.section, args.question, misconception, lang])
    out_dir = sec_dir / "explain" / hashlib.sha1(key.encode()).hexdigest()[:12]
    if (out_dir / "explain.json").exists():
        print(out_dir / "explain.json")
        return

    file = section["passages"][0]["file"]
    src = "\n\n".join(f"[{p['file']} p.{p['page']}]\n{p['text']}" for p in section["passages"])
    q_text = f"{question['question']}\nOptions: {question['options']}"
    user = (f"FILE = {file}\n\nSOURCE PAGES:\n{src}{pipeline.profile_block(profile)}\n\n"
            f"QUIZ QUESTION (do not answer it):\n{q_text}\n\n<diagnosed_misconception>\n{misconception}\n"
            "</diagnosed_misconception>")
    t0 = time.time()
    script, verdict, attempts = chat_json("explain", LLM_MODEL, EXPLAIN_SYSTEM, user), None, 0
    for attempts in (1, 2):  # ponytail: one regeneration on jury fail, then ship as "flagged" (same as pipeline)
        verdict = chat_json("explain_jury", JURY_MODEL, EXPLAIN_JURY,
                            f"{user}\n\nGENERATED SCRIPT:\n{json.dumps(script, ensure_ascii=False)}")
        if verdict.get("verdict") == "pass" or attempts == 2:
            break
        script = chat_json("explain", LLM_MODEL, EXPLAIN_SYSTEM,
                           f"{user}\n\nA reviewer rejected your previous version. Fix:\n"
                           + ("\n".join(verdict.get("issues", [])) or verdict.get("reason", "")))

    os.environ.setdefault("RENDER_QUALITY", "-l")
    pipeline.QUALITY = os.environ["RENDER_QUALITY"]
    tmp_dir = out_dir.with_name(out_dir.name + ".tmp")
    shutil.rmtree(tmp_dir, ignore_errors=True)
    tmp_dir.mkdir(parents=True)
    voice = tts.VOICES["en" if STUB else lang]  # stub text is English
    duration, transcript = pipeline.render(script, tmp_dir, file, voice)
    base = f"/content/{args.lecture}/{args.section}/explain/{out_dir.name}"
    data = {"title": script.get("title", ""), "misconception": misconception, "question_id": args.question,
            "language": "en" if STUB else lang,
            "video": f"{base}/video.mp4", "captions": f"{base}/captions.vtt", "duration": duration,
            "transcript": transcript, "citations": script.get("citations", []),
            "jury": {"verdict": "pass" if verdict.get("verdict") == "pass" else "flagged",
                     "reason": verdict.get("reason", ""), "model": JURY_MODEL, "attempts": attempts}}
    (tmp_dir / "explain.json").write_text(json.dumps(data, indent=2, ensure_ascii=False))
    shutil.rmtree(out_dir, ignore_errors=True)
    tmp_dir.rename(out_dir)  # atomic publish: cache hit only on a complete folder
    print(f"[{time.time() - t0:.0f}s] {duration}s video", file=sys.stderr)
    print(out_dir / "explain.json")


if __name__ == "__main__":
    main()
