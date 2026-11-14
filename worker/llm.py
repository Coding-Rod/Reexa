"""OpenRouter chat -> JSON. LLM_STUB=1 returns canned Databases 2 content (no key needed)."""
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _load_env():
    env = ROOT / ".env.local"
    if env.exists():
        for line in env.read_text().splitlines():
            m = re.match(r"\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$", line)
            if m and m.group(1) not in os.environ:
                os.environ[m.group(1)] = m.group(2).strip().strip('"').strip("'")


_load_env()
LLM_MODEL = os.environ.get("LLM_MODEL", "anthropic/claude-sonnet-5.5")
JURY_MODEL = os.environ.get("JURY_MODEL", "openai/gpt-5.5")
STUB = os.environ.get("LLM_STUB") == "1"


def _parse(text):
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end < 0:
        raise ValueError(f"no JSON object in reply: {text[:200]!r}")
    return json.loads(text[start : end + 1])


def chat_json(task, model, system, user):
    """task names the stub to return when LLM_STUB=1."""
    if STUB:
        return json.loads(json.dumps(STUBS[task]))
    from openai import OpenAI

    client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=os.environ["OPENROUTER_API_KEY"])
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    last = None
    for _ in range(2):  # ponytail: one retry on unparseable JSON
        reply = client.chat.completions.create(model=model, messages=messages, temperature=0.3)
        text = reply.choices[0].message.content or ""
        try:
            return _parse(text)
        except (ValueError, json.JSONDecodeError) as e:
            last = e
            messages += [{"role": "assistant", "content": text},
                         {"role": "user", "content": "That was not valid JSON. Reply with the JSON object only."}]
    raise last


F = "02-Concurrency.pdf"

STUBS = {
    "outline": {
        "sections": [
            {"title": "View vs conflict serializability", "pages": [20, 41],
             "summary": "Serializable schedules, VSR, conflicts, conflict graph, CSR ⊂ VSR."},
            {"title": "Two-phase locking", "pages": [44, 59], "summary": "Locks, 2PL rule, 2PL ⊂ CSR."},
            {"title": "Strict 2PL and dirty reads", "pages": [60, 70], "summary": "Strict 2PL."},
        ]
    },
    "section": {
        "title": "View vs conflict serializability",
        "beats": [
            {"narration": "Two transactions run at the same time. When is their interleaving still correct? "
                          "The course gives two answers: view-serializability and conflict-serializability. "
                          "They are not the same thing, and the difference is a classic exam trap.",
             "visual": {"type": "title", "text": "Serializable, but which kind?",
                        "subtitle": "View vs conflict serializability"}, "pages": [20]},
            {"narration": "A schedule is serializable if it leaves the database in the same state as some serial "
                          "schedule of the same transactions. To check that, we need a notion of equivalence, "
                          "and each notion gives a different class of schedules.",
             "visual": {"type": "bullets", "heading": "Serializable schedule",
                        "items": ["Same final state as some serial schedule",
                                  "Needs a notion of equivalence",
                                  "Different equivalences, different classes"]}, "pages": [20]},
            {"narration": "View-equivalence asks for three things: the same operations, every read reads from "
                          "the same write, and every object gets its final value from the same write. "
                          "A schedule that is view-equivalent to a serial one is in VSR.",
             "visual": {"type": "bullets", "heading": "View-equivalence (VSR)",
                        "items": ["Same operations", "Same reads-from relation", "Same final writes"]},
             "pages": [22]},
            {"narration": "Conflict-serializability is stricter. Two operations conflict when they belong to "
                          "different transactions, touch the same object, and at least one of them is a write. "
                          "Two reads never conflict.",
             "visual": {"type": "bullets", "heading": "Conflicting operations",
                        "items": ["Different transactions, same object", "At least one is a write",
                                  "r-w, w-r and w-w conflicts"]}, "pages": [32]},
            {"narration": "Take this schedule from the slides. T1 reads x, T2 writes x, T1 writes x, and T3 "
                          "writes x. T2 and T1 write x without reading it first: these are blind writes.",
             "visual": {"type": "schedule", "heading": "S = r1(x) w2(x) w1(x) w3(x)",
                        "ops": ["r1(x)", "w2(x)", "w1(x)", "w3(x)"], "highlight": [1, 2]}, "pages": [41]},
            {"narration": "Now build the conflict graph: one node per transaction, one arc for every conflicting "
                          "pair, in order. r1 before w2 gives an arc from T1 to T2, and w2 before w1 gives an arc "
                          "from T2 back to T1. That is a cycle, so the schedule is not conflict-serializable.",
             "visual": {"type": "graph", "heading": "Conflict graph of S", "nodes": ["T1", "T2", "T3"],
                        "edges": [["T1", "T2"], ["T2", "T1"], ["T1", "T3"], ["T2", "T3"]],
                        "highlight": [0, 1]}, "pages": [37, 41]},
            {"narration": "Yet compare it with the serial schedule T1, T2, T3. T1 still reads the initial value "
                          "of x, and T3 still writes the final value. Same reads-from, same final write: the "
                          "schedule is view-serializable. The blind writes in the middle are overwritten, so "
                          "their order does not matter to anyone.",
             "visual": {"type": "schedule", "heading": "Serial T1 T2 T3",
                        "ops": ["r1(x)", "w1(x)", "w2(x)", "w3(x)"], "highlight": [0, 3]}, "pages": [34, 41]},
            {"narration": "So every conflict-serializable schedule is view-serializable, but not the other way "
                          "around. A cycle in the conflict graph rules out CSR, not VSR. Deciding VSR is much "
                          "harder, which is why real schedulers rely on the conflict test.",
             "visual": {"type": "formula", "heading": "Takeaway",
                        "latex": r"\text{CSR} \subset \text{VSR}"}, "pages": [30, 34]},
        ],
        "notes_md": (
            "## Key ideas\n"
            "- **Serializable schedule**: leaves the database in the same state as some serial schedule of the "
            f"same transactions [{F} p.20].\n"
            "- **View-equivalence**: same operations, same *reads-from* relation, same *final writes*. "
            f"VSR = schedules view-equivalent to a serial one [{F} p.22].\n"
            "- **Conflict**: two operations of different transactions on the same object, at least one a write "
            f"(r-w, w-r, w-w). Two reads never conflict [{F} p.32].\n"
            "- **Conflict graph**: one node per transaction, an arc Ti → Tj when an operation of Ti conflicts with "
            f"and precedes one of Tj. S ∈ CSR ⇔ the graph is acyclic [{F} p.37].\n"
            f"- **CSR ⊂ VSR**: every CSR schedule is VSR, not the converse [{F} p.34].\n\n"
            "## Worked example\n"
            "`r1(x) w2(x) w1(x) w3(x)` has the cycle T1 → T2 → T1, so it is **not CSR**. It is still **VSR**: it is "
            "view-equivalent to the serial T1 T2 T3, because the blind writes w2(x), w1(x) are overwritten by "
            f"w3(x) [{F} p.41].\n\n"
            "## Watch out\n"
            "- A cycle in the conflict graph rules out CSR, **not** VSR.\n"
            f"- Deciding VSR is computationally hard; schedulers use conflict-based tests [{F} p.30].\n"
        ),
        "citations": [
            {"file": F, "page": 20, "quote": "A schedule that leaves the database in the same state as some "
                                             "serial schedule of the same transactions"},
            {"file": F, "page": 22, "quote": "Two schedules are view-equivalent if: they have 1) the same operations, "
                                             "2) the same reads-from relationship, and 3) the same final writes"},
            {"file": F, "page": 32, "quote": "Two operations oi and oj (i ≠ j) are in conflict if they address the "
                                             "same resource and at least one of them is a write"},
            {"file": F, "page": 34, "quote": "all conflict-serializable schedules are also view-serializable, but "
                                             "the converse is not necessarily true"},
            {"file": F, "page": 37, "quote": "A schedule is in CSR if and only if its conflict graph is acyclic"},
            {"file": F, "page": 41, "quote": "r1(x) w2(x) w1(x) w3(x) it is VSR ... it is not CSR, due to the "
                                             "presence of the cycle"},
        ],
        "quiz": [
            {"id": "q1", "concept": "csr-vs-vsr",
             "question": "The conflict graph of a schedule S contains a cycle. What can you conclude?",
             "options": ["S is neither CSR nor VSR", "S is not CSR, but it may still be VSR",
                         "S is VSR but not serial", "S is CSR"],
             "answer_index": 1,
             "explanation": "An acyclic conflict graph is equivalent to CSR, so a cycle rules out CSR. "
                            "VSR is a larger class: r1(x) w2(x) w1(x) w3(x) has a cycle and is still VSR.",
             "citations": [{"file": F, "page": 34, "quote": "the converse is not necessarily true"},
                           {"file": F, "page": 37, "quote": "in CSR if and only if its conflict graph is acyclic"}]},
            {"id": "q2", "concept": "conflict",
             "question": "Which pair of operations is in conflict?",
             "options": ["r1(x), r2(x)", "r1(x), w1(x)", "w1(x), r2(y)", "r1(x), w2(x)"],
             "answer_index": 3,
             "explanation": "A conflict needs different transactions, the same object, and at least one write. "
                            "Only r1(x), w2(x) satisfies all three.",
             "citations": [{"file": F, "page": 32, "quote": "same resource and at least one of them is a write"}]},
            {"id": "q3", "concept": "view-equivalence",
             "question": "Which condition is NOT required for two schedules to be view-equivalent?",
             "options": ["Same operations", "Same reads-from relation", "Same final writes",
                         "Same order of all conflicting operations"],
             "answer_index": 3,
             "explanation": "Same order of conflicting operations defines conflict-equivalence, not "
                            "view-equivalence.",
             "citations": [{"file": F, "page": 22, "quote": "the same operations, the same reads-from "
                                                            "relationship, and the same final writes"}]},
        ],
    },
    "explain": {
        "title": "Conflict test vs view test",
        "beats": [
            {"narration": "Your reasoning treated the conflict test as the definition of serializability. "
                          "Let's pull the two ideas apart.",
             "visual": {"type": "title", "text": "Conflict test vs view test",
                        "subtitle": "Two tests, two different questions"}, "pages": [22, 34]},
            {"narration": "View-serializability asks: same reads and same final writes as some serial schedule? "
                          "Conflict-serializability is stricter: the same order on every conflicting pair. "
                          "Every CSR schedule is VSR; the converse is not necessarily true.",
             "visual": {"type": "bullets", "heading": "Two definitions",
                        "items": ["VSR: same reads-from and final writes", "CSR: same order of all conflicts",
                                  "CSR ⊂ VSR"]}, "pages": [22, 34]},
            {"narration": "Look at this schedule. T2 and T1 write x without reading it first: these are blind writes. "
                          "Their order creates conflicts in both directions, yet nobody ever reads what they wrote, "
                          "because T3 overwrites x at the end.",
             "visual": {"type": "schedule", "heading": "Blind writes",
                        "ops": ["r1(x)", "w2(x)", "w1(x)", "w3(x)"], "highlight": [1, 2]}, "pages": [41]},
            {"narration": "Against the serial order T1, T2, T3: T1 reads the initial x and T3 writes last, in both. "
                          "So what does a conflict cycle really tell you? Try the next question yourself.",
             "visual": {"type": "bullets", "heading": "Check the view conditions",
                        "items": ["r1(x) reads the initial x", "Final write on x: w3(x)",
                                  "Same as serial T1 T2 T3?"]}, "pages": [22, 41]},
        ],
        "citations": [
            {"file": F, "page": 22, "quote": "the same operations, the same reads-from relationship, and the same "
                                            "final writes"},
            {"file": F, "page": 34, "quote": "the converse is not necessarily true"},
            {"file": F, "page": 41, "quote": "r1(x) w2(x) w1(x) w3(x)"},
        ],
    },
    "explain_jury": {"verdict": "pass", "issues": [],
                     "reason": "Beats match pages 22, 34 and 41; the video explains CSR vs VSR and ends with a "
                               "question instead of stating the answer to q1."},
    "jury": {"verdict": "pass", "issues": [],
             "reason": "All claims match the cited pages (20, 22, 30, 32, 34, 37, 41); narration does not reveal "
                       "quiz answers; quiz answers are correct."},
}
