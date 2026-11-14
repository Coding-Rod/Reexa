"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { courseSlug, LANGUAGES, LEVELS, LIMITS, STYLES, type Armor, type Language, type Level, type Style } from "@/lib/profile";
import { loadProfile, saveProfile } from "@/lib/store";

const FILTER_LABELS: Record<string, string> = {
  pi_and_jailbreak: "prompt injection / jailbreak",
  answer_leak: "asks for answers",
  malicious_uris: "links",
  code_or_markup: "code or markup",
  sdp: "personal data",
  rai: "harmful content",
  csam: "harmful content",
  llm_classifier: "not a study-style preference",
  unavailable: "guard unavailable",
};

const input = "w-full rounded-lg border border-border bg-surface px-3 py-2 focus:border-accent focus:outline-none";

export default function StartForm() {
  const [name, setName] = useState("");
  const [course, setCourse] = useState("Databases 2");
  const [examDate, setExamDate] = useState("");
  const [level, setLevel] = useState<Level>("beginner");
  const [language, setLanguage] = useState<Language>("en");
  const [styles, setStyles] = useState<Style[]>(["visual"]);
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [armor, setArmor] = useState<Armor | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const p = loadProfile();
    if (!p) return;
    // Prefill from this browser's saved profile after mount (localStorage is client-only).
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage */
    setName(p.name ?? "");
    setCourse(p.course);
    setExamDate(p.exam_date ?? "");
    setLevel(p.level);
    setLanguage(p.language);
    setStyles(p.styles);
    setInstructions(p.instructions);
    setArmor(p.armor ?? null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    setArmor(null);
    try {
      // No name in the request: it never leaves this browser.
      const res = await fetch("/api/profile/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, exam_date: examDate || null, level, language, styles, instructions }),
      });
      const data = await res.json();
      if (data.errors) setErrors(data.errors);
      if (data.armor) setArmor(data.armor);
      if (data.ok) saveProfile({ ...data.profile, name: name.trim().slice(0, LIMITS.name) });
    } catch {
      setErrors(["Could not reach the server. Try again."]);
    } finally {
      setBusy(false);
    }
  }

  const toggle = (s: Style) => setStyles((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const engine = armor?.engine === "model_armor" ? "Model Armor" : "local guard";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <p className="text-sm text-muted">Step 1 of 3</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your learning profile</h1>
      <p className="mt-2 text-muted">
        Tell the tutor how to build your lessons. Your free-text instructions are security-checked before any AI sees them.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="name" className="mb-1 block font-medium">
            Name <span className="text-sm font-normal text-muted">(optional)</span>
          </label>
          <input id="name" className={input} maxLength={LIMITS.name} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
          <p className="mt-1 text-sm text-muted">Your name stays in your browser and is never sent to the server or to any AI.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="course" className="mb-1 block font-medium">
              Course
            </label>
            <input id="course" required className={input} maxLength={LIMITS.course} value={course} onChange={(e) => setCourse(e.target.value)} />
          </div>
          <div>
            <label htmlFor="exam" className="mb-1 block font-medium">
              Exam date <span className="text-sm font-normal text-muted">(optional)</span>
            </label>
            <input id="exam" type="date" className={input} value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label htmlFor="language" className="mb-1 block font-medium">
            Output language
          </label>
          <select id="language" className={input} value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
            {Object.entries(LANGUAGES).map(([code, label]) => (
              <option key={code} value={code} lang={code}>
                {label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-muted">Narration, captions, notes and quizzes. Slide quotes stay in their original language.</p>
        </div>

        <fieldset>
          <legend className="mb-2 font-medium">Your level in this course</legend>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <label key={l} className={`cursor-pointer rounded-full border px-4 py-1.5 capitalize has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${level === l ? "border-accent bg-accent-soft" : "border-border"}`}>
                <input type="radio" name="level" value={l} checked={level === l} onChange={() => setLevel(l)} className="sr-only" />
                {l}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-medium">How do you learn best?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(STYLES).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={styles.includes(key as Style)} onChange={() => toggle(key as Style)} className="h-4 w-4 accent-[var(--color-accent)]" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="instructions" className="mb-1 block font-medium">
            Anything else the tutor should know? <span className="text-sm font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="instructions"
            rows={4}
            maxLength={LIMITS.instructions}
            className={input}
            placeholder="e.g. Go slowly on formulas and use everyday analogies."
            value={instructions}
            onChange={(e) => {
              setInstructions(e.target.value);
              setArmor(null);
            }}
            aria-describedby="instructions-help"
          />
          <p id="instructions-help" className="mt-1 flex justify-between text-sm text-muted">
            <span>Style preferences only. They can&apos;t change sources or reveal answers.</span>
            <span aria-live="polite">
              {instructions.length}/{LIMITS.instructions}
            </span>
          </p>
        </div>

        {errors.length > 0 && (
          <ul role="alert" className="rounded-lg border border-bad/40 bg-bad/10 p-3 text-sm text-bad">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}

        {armor && (
          <div role="status" className={`rounded-lg border p-3 text-sm ${armor.verdict === "pass" ? "border-good/40 bg-good/10" : "border-bad/40 bg-bad/10"}`}>
            {armor.verdict === "pass" ? (
              <>
                <p className="font-medium text-good">✓ Checked by {engine}. Profile saved.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/course/${courseSlug(course)}`}
                    className="inline-flex rounded-lg bg-accent px-3.5 py-2 font-medium text-accent-fg hover:opacity-90"
                  >
                    Go to {course || "my course"}
                  </Link>
                  <Link href="/dashboard" className="inline-flex rounded-lg border border-border px-3.5 py-2 hover:border-accent hover:text-accent">
                    My progress
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="font-medium text-bad">Blocked by {engine}: please edit your instructions.</p>
                <p className="mt-1">{armor.reason}</p>
                {armor.matched.length > 0 && (
                  <p className="mt-1 text-muted">Matched: {armor.matched.map((m) => FILTER_LABELS[m] ?? m).join(", ")}</p>
                )}
              </>
            )}
          </div>
        )}

        <button type="submit" disabled={busy} className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-fg disabled:opacity-50 sm:w-auto">
          {busy ? "Checking…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}
