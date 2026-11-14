"use client";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import AuthButton, { useUser } from "@/components/AuthButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, authEnabled } from "@/lib/firebase";
import { LANGUAGES, LIMITS, STYLES, type Armor, type Language, type Style } from "@/lib/profile";
import { clearDraft, clearLocalData, loadDraft, loadProfile, saveDraft, saveProfile } from "@/lib/store";

export const FILTER_LABELS: Record<string, string> = {
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

export const input = "w-full rounded-lg border border-border bg-surface px-3 py-2 focus:border-accent focus:outline-none";
const TABS = ["preferences", "instructions", "privacy", "review"] as const;
type Tab = (typeof TABS)[number];
const LABELS: Record<Tab, string> = { preferences: "Preferences", instructions: "Tutor instructions", privacy: "Privacy", review: "Review" };
type Draft = { tab: Tab; language: Language; styles: Style[]; instructions: string };
const ghost = "rounded-lg border border-border px-4 py-2 hover:border-accent";
const primary = "ml-auto rounded-lg bg-accent px-4 py-2 font-medium text-accent-fg disabled:opacity-50";

export default function ProfileForm() {
  const user = useUser();
  const [language, setLanguage] = useState<Language>("en");
  const [styles, setStyles] = useState<Style[]>(["visual"]);
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [armor, setArmor] = useState<Armor | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [tab, setTab] = useState<Tab>("preferences");
  const [restored, setRestored] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Saved profile first, then any unsaved draft on top of it.
  function hydrate(withDraft: boolean) {
    const p = loadProfile();
    const d = withDraft ? loadDraft<Draft>("profile") : null;
    setLanguage(d?.language ?? p?.language ?? "en");
    setStyles(d?.styles ?? p?.styles ?? ["visual"]);
    setInstructions(d?.instructions ?? p?.instructions ?? "");
    setArmor(d ? null : (p?.armor ?? null));
    setTab(d?.tab ?? "preferences");
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage */
    hydrate(true);
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!restored || saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflects the storage write result
    setDraftSaved(saveDraft("profile", { tab, language, styles, instructions } satisfies Draft));
  }, [restored, saved, tab, language, styles, instructions]);

  function startOver() {
    if (!confirm("Start over? Unsaved changes to your profile are discarded.")) return;
    clearDraft("profile");
    hydrate(false);
    setErrors([]);
    setSaved(false);
    setTab("preferences");
  }

  async function save() {
    setBusy(true);
    setErrors([]);
    setSaved(false);
    try {
      const res = await fetch("/api/profile/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, styles, instructions }),
      });
      const data = await res.json();
      if (data.errors) setErrors(data.errors);
      setArmor(data.armor ?? null);
      if (data.ok) {
        saveProfile(data.profile);
        clearDraft("profile");
        setSaved(true);
      }
    } catch {
      setErrors(["Could not reach the server. Try again."]);
    } finally {
      setBusy(false);
    }
  }

  const toggle = (s: Style) => {
    setSaved(false);
    setStyles((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  };
  const engine = armor?.engine === "model_armor" ? "Model Armor" : "local guard";
  const status = (
    <>
      {errors.length > 0 && (
        <ul role="alert" className="rounded-lg border border-bad/40 bg-bad/10 p-3 text-sm text-bad">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {saved && <p role="status" className="text-sm font-medium text-good">✓ Saved. Checked by {engine}.</p>}
      {armor?.verdict === "block" && (
        <div role="alert" className="rounded-lg border border-bad/40 bg-bad/10 p-3 text-sm">
          <p className="font-medium text-bad">Blocked by {engine}: please edit your instructions.</p>
          <p className="mt-1">{armor.reason}</p>
          {armor.matched.length > 0 && <p className="mt-1 text-muted">Matched: {armor.matched.map((m) => FILTER_LABELS[m] ?? m).join(", ")}</p>}
        </div>
      )}
    </>
  );

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-muted">Your account and how the tutor should teach you. Course details live in each course.</p>

      <section aria-label="Account" className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
        {!authEnabled ? (
          <p className="text-sm text-muted">Sign-in not configured.</p>
        ) : user ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- Google avatar, external URL */}
            {user.photoURL && <img src={user.photoURL} alt="" className="size-12 rounded-full" referrerPolicy="no-referrer" />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{user.displayName}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
            <button type="button" onClick={() => signOut(auth!)} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-accent">
              Sign out
            </button>
          </>
        ) : (
          <>
            <p className="flex-1 text-sm text-muted">Sign in to show your name and keep your account.</p>
            <AuthButton />
          </>
        )}
      </section>

      <div className="mt-8 flex items-center gap-3 text-sm">
        <span aria-live="polite" className="text-muted">
          {draftSaved && !saved ? "Draft saved" : ""}
        </span>
        <button type="button" onClick={startOver} className="ml-auto text-muted underline hover:text-accent">
          Start over
        </button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-2">
        <TabsList variant="line">
          {TABS.map((t, i) => (
            <TabsTrigger key={t} value={t}>
              <span className="text-xs text-muted">{i + 1}</span> {LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          <div>
            <label htmlFor="language" className="mb-1 block font-medium">
              Default output language
            </label>
            <select id="language" className={input} value={language} onChange={(e) => {
                setLanguage(e.target.value as Language);
                setSaved(false);
              }}>
              {Object.entries(LANGUAGES).map(([code, label]) => (
                <option key={code} value={code} lang={code}>
                  {label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-muted">Narration, captions, notes and quizzes. A course can override it.</p>
          </div>
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
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setTab("instructions")} className={primary}>
              Continue
            </button>
          </div>
        </TabsContent>

        <TabsContent value="instructions" className="space-y-4">
          <div>
            <label htmlFor="instructions" className="mb-1 block font-medium">
              Anything the tutor should know? <span className="text-sm font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="instructions"
              rows={5}
              maxLength={LIMITS.instructions}
              className={input}
              placeholder="e.g. Go slowly on formulas and use everyday analogies."
              value={instructions}
              onChange={(e) => {
                setInstructions(e.target.value);
                setArmor(null);
                setSaved(false);
              }}
              aria-describedby="instructions-help"
            />
            <p id="instructions-help" className="mt-1 flex justify-between text-sm text-muted">
              <span>Style preferences only, security-checked before any AI sees them.</span>
              <span aria-live="polite">
                {instructions.length}/{LIMITS.instructions}
              </span>
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setTab("preferences")} className={ghost}>
              Back
            </button>
            <button type="button" onClick={() => setTab("privacy")} className={primary}>
              Continue
            </button>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4 text-sm">
          <ul className="space-y-2 rounded-xl border border-border bg-surface p-4">
            <li>
              <span className="font-medium">In this browser only:</span> your notes, progress, preferences, course settings and quiz history.
            </li>
            <li>
              <span className="font-medium">Sent to the AI:</span> your output language, learning styles and checked tutor instructions. Never your
              name or email.
            </li>
            <li>
              <span className="font-medium">Google sign-in:</span> handled by Firebase; Reexa only shows your name and photo.
            </li>
          </ul>
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete all your notes, progress, preferences and course settings from this browser? This cannot be undone.")) {
                clearLocalData();
                setCleared(true);
              }
            }}
            className="rounded-lg border border-bad/50 px-4 py-2 text-bad hover:bg-bad/10"
          >
            Clear my local data
          </button>
          {cleared && <p role="status" className="text-good">Local data cleared.</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setTab("instructions")} className={ghost}>
              Back
            </button>
            <button type="button" onClick={() => setTab("review")} className={primary}>
              Continue
            </button>
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <dl className="grid gap-3 rounded-xl border border-border bg-surface p-4 text-sm">
            {(
              [
                ["Default language", LANGUAGES[language], "preferences"],
                ["Learning style", styles.map((x) => STYLES[x]).join(", ") || "—", "preferences"],
                ["Tutor instructions", instructions || "—", "instructions"],
              ] as const
            ).map(([k, v, t]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="flex items-start justify-between gap-2">
                  <span className="break-words">{v}</span>
                  <button type="button" onClick={() => setTab(t)} className="shrink-0 text-xs text-accent underline">
                    Edit
                  </button>
                </dd>
              </div>
            ))}
          </dl>
          {status}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setTab("privacy")} className={ghost}>
              Back
            </button>
            <button type="button" onClick={save} disabled={busy} className={primary}>
              {busy ? "Checking…" : "Save profile"}
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
