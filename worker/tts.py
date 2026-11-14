"""edge-tts per beat: mp3 + word timings (seconds)."""
import asyncio
import subprocess
import re
import time
import unicodedata

import edge_tts

VOICES = {"en": "en-US-AndrewMultilingualNeural", "it": "it-IT-DiegoNeural", "es": "es-ES-AlvaroNeural",
          "fr": "fr-FR-HenriNeural", "de": "de-DE-ConradNeural", "pt": "pt-BR-AntonioNeural"}
VOICE = VOICES["en"]


async def _synth(text, out_path, voice):
    words = []
    with open(out_path, "wb") as f:
        async for chunk in edge_tts.Communicate(text, voice, rate="-5%", boundary="WordBoundary").stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 1e7  # 100 ns units
                words.append((start, start + chunk["duration"] / 1e7, chunk["text"]))
    return words


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                          str(path)], capture_output=True, text=True, check=True).stdout
    return float(out)


def speakable(text):
    """LLM narration can carry symbols that make edge-tts return no audio (SSML chars, LaTeX, odd unicode)."""
    t = unicodedata.normalize("NFKC", text)  # r₁ -> r1, ligatures, full-width chars
    t = t.replace("&", " and ").replace("→", " to ").replace("≤", " at most ").replace("≥", " at least ")
    t = re.sub(r"[<>{}\\$^_|*#`~\[\]]", " ", t)
    t = "".join(c for c in t if c.isprintable())
    return re.sub(r"\s+", " ", t).strip()


def synth(text, out_path, voice=VOICE):
    """Returns (duration_seconds, [(start, end, word), ...])."""
    text = speakable(text)
    for attempt in range(4):  # edge-tts drops requests intermittently (403 / NoAudioReceived)
        try:
            words = asyncio.run(_synth(text, out_path, voice))
            return duration(out_path), words
        except Exception as e:
            if attempt == 3:
                print(f"tts failed on text: {text!r}", flush=True)
                raise
            print(f"tts retry {attempt + 1}: {e}", flush=True)
            time.sleep(1.5 * (attempt + 1))


def cues(text, words, offset, max_chars=42):
    """Caption cues from the narration text (keeps punctuation), timed by TTS word boundaries.
    Token i takes the timing of boundary word round(i * m / n): edge-tts drops punctuation and may split
    tokens differently, so map by position.  # ponytail: proportional alignment, fuzzy-match if drift shows
    Breaks at max_chars or after sentence-ending punctuation."""
    tokens = text.split()
    if not tokens or not words:
        return []
    n, m = len(tokens), len(words)
    timed = [(words[min(m - 1, round(i * m / n))][0], words[min(m - 1, round(i * m / n))][1], t)
             for i, t in enumerate(tokens)]
    timed[-1] = (timed[-1][0], words[-1][1], timed[-1][2])
    out, cur = [], []
    for w in timed:
        if cur and len(" ".join(x[2] for x in cur + [w])) > max_chars:
            out.append(cur)
            cur = []
        cur.append(w)
        if w[2][-1] in ".?!:":
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return [(offset + c[0][0], offset + c[-1][1], " ".join(x[2] for x in c)) for c in out]


if __name__ == "__main__":
    text = "Two transactions run at the same time. Is it correct?"
    ws = [(i * 0.5, i * 0.5 + 0.4, w) for i, w in enumerate("Two transactions run at the same time Is it correct".split())]
    cs = cues(text, ws, 10, max_chars=30)
    assert [c[2] for c in cs] == ["Two transactions run at the", "same time.", "Is it correct?"], cs
    assert cs[0][0] == 10 and cs[-1][1] == 10 + 4.9, cs
    assert speakable("r₁(x) → w₂(x) & <b>$x$</b>") == "r1(x) to w2(x) and b x /b", speakable("r₁(x) → w₂(x) & <b>$x$</b>")
    print("ok", cs)
