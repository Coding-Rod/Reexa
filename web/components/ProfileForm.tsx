"use client";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import AuthButton, { useUser } from "@/components/AuthButton";
import { useLang, useSetLang, useT } from "@/components/Lang";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, authEnabled } from "@/lib/firebase";
import { LANGUAGES, LIMITS, STYLES, type Armor, type Language, type Style } from "@/lib/profile";
import { clearDraft, clearLocalData, loadDraft, loadProfile, saveDraft, saveProfile } from "@/lib/store";

export const input = "w-full rounded-lg border border-border bg-surface px-3 py-2 focus:border-accent focus:outline-none";
const TABS = ["preferences", "instructions", "privacy", "review"] as const;
type Tab = (typeof TABS)[number];
type Draft = { tab: Tab; uiLang: Language; language: Language; styles: Style[]; instructions: string };
const ghost = "rounded-lg border border-border px-4 py-2 hover:border-accent";
const primary = "ml-auto rounded-lg bg-accent px-4 py-2 font-medium text-accent-fg disabled:opacity-50";

export default function ProfileForm() {
  const t = useT();
  const currentUiLang = useLang();
  const setUiLang = useSetLang();
  const user = useUser();
  const [uiLang, setUiLangChoice] = useState<Language>(currentUiLang);
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
    setUiLangChoice(d?.uiLang ?? currentUiLang);
    setLanguage(d?.language ?? p?.language ?? currentUiLang);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only; later language changes must not reset the form
  }, []);

  useEffect(() => {
    if (!restored || saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflects the storage write result
    setDraftSaved(saveDraft("profile", { tab, uiLang, language, styles, instructions } satisfies Draft));
  }, [restored, saved, tab, uiLang, language, styles, instructions]);

  function startOver() {
    if (!confirm(t.profile.startOverConfirm)) return;
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
        if (uiLang !== currentUiLang) setUiLang(uiLang);
      }
    } catch {
      setErrors([t.common.networkError]);
    } finally {
      setBusy(false);
    }
  }

  const toggle = (s: Style) => {
    setSaved(false);
    setStyles((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  };
  const engine = t.profile.engines[armor?.engine ?? "local"];
  const status = (
    <>
      {errors.length > 0 && (
        <ul role="alert" className="rounded-lg border border-bad/40 bg-bad/10 p-3 text-sm text-bad">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {saved && <p role="status" className="text-sm font-medium text-good">{t.profile.saved(engine)}</p>}
      {armor?.verdict === "block" && (
        <div role="alert" className="rounded-lg border border-bad/40 bg-bad/10 p-3 text-sm">
          <p className="font-medium text-bad">{t.profile.blocked(engine)}</p>
          <p className="mt-1">{armor.reason}</p>
          {armor.matched.length > 0 && <p className="mt-1 text-muted">{t.profile.matched} {armor.matched.map((m) => t.profile.filters[m] ?? m).join(", ")}</p>}
        </div>
      )}
    </>
  );

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t.profile.title}</h1>
      <p className="mt-2 text-muted">{t.profile.intro}</p>

      <section aria-label={t.profile.account} className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
        {!authEnabled ? (
          <p className="text-sm text-muted">{t.profile.notConfigured}</p>
        ) : user ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- Google avatar, external URL */}
            {user.photoURL && <img src={user.photoURL} alt="" className="size-12 rounded-full" referrerPolicy="no-referrer" />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{user.displayName}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
            <button type="button" onClick={() => signOut(auth!)} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:border-accent">
              {t.auth.signOut}
            </button>
          </>
        ) : (
          <>
            <p className="flex-1 text-sm text-muted">{t.profile.signInHint}</p>
            <AuthButton />
          </>
        )}
      </section>

      <div className="mt-8 flex items-center gap-3 text-sm">
        <span aria-live="polite" className="text-muted">
          {draftSaved && !saved ? t.common.draftSaved : ""}
        </span>
        <button type="button" onClick={startOver} className="ml-auto text-muted underline hover:text-accent">
          {t.common.startOver}
        </button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-2">
        <TabsList variant="line">
          {TABS.map((id, i) => (
            <TabsTrigger key={id} value={id}>
              <span className="text-xs text-muted">{i + 1}</span> {t.profile.tabs[id]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          <div>
            <label htmlFor="ui-language" className="mb-1 block font-medium">
              {t.profile.uiLanguage}
            </label>
            <select
              id="ui-language"
              className={input}
              value={uiLang}
              onChange={(e) => {
                setUiLangChoice(e.target.value as Language);
                setSaved(false);
              }}
            >
              {Object.entries(LANGUAGES).map(([code, label]) => (
                <option key={code} value={code} lang={code}>
                  {label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-muted">{t.profile.uiLanguageHint}</p>
          </div>
          <div>
            <label htmlFor="language" className="mb-1 block font-medium">
              {t.profile.defaultLanguage}
            </label>
            <select id="language" className={input} value={language} onChange={(e) => {
                setLanguage(e.target.value as Language);
                setSaved(false);
              }}>
              {(Object.keys(LANGUAGES) as Language[]).map((code) => (
                <option key={code} value={code}>
                  {t.langNames[code]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-muted">{t.profile.defaultLanguageHint}</p>
          </div>
          <fieldset>
            <legend className="mb-2 font-medium">{t.profile.howLearn}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(STYLES) as Style[]).map((key) => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" checked={styles.includes(key)} onChange={() => toggle(key)} className="h-4 w-4 accent-[var(--color-accent)]" />
                  {t.styles[key]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setTab("instructions")} className={primary}>
              {t.common.continue}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="instructions" className="space-y-4">
          <div>
            <label htmlFor="instructions" className="mb-1 block font-medium">
              {t.profile.instructions} <span className="text-sm font-normal text-muted">{t.common.optional}</span>
            </label>
            <textarea
              id="instructions"
              rows={5}
              maxLength={LIMITS.instructions}
              className={input}
              placeholder={t.profile.instructionsPlaceholder}
              value={instructions}
              onChange={(e) => {
                setInstructions(e.target.value);
                setArmor(null);
                setSaved(false);
              }}
              aria-describedby="instructions-help"
            />
            <p id="instructions-help" className="mt-1 flex justify-between text-sm text-muted">
              <span>{t.profile.instructionsHint}</span>
              <span aria-live="polite">
                {instructions.length}/{LIMITS.instructions}
              </span>
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setTab("preferences")} className={ghost}>
              {t.common.back}
            </button>
            <button type="button" onClick={() => setTab("privacy")} className={primary}>
              {t.common.continue}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4 text-sm">
          <ul className="space-y-2 rounded-xl border border-border bg-surface p-4">
            <li>
              <span className="font-medium">{t.profile.browserOnly}</span> {t.profile.browserOnlyText}
            </li>
            <li>
              <span className="font-medium">{t.profile.sentToAi}</span> {t.profile.sentToAiText}
            </li>
            <li>
              <span className="font-medium">{t.profile.googleSignIn}</span> {t.profile.googleSignInText}
            </li>
          </ul>
          <button
            type="button"
            onClick={() => {
              if (confirm(t.profile.clearConfirm)) {
                clearLocalData();
                setCleared(true);
              }
            }}
            className="rounded-lg border border-bad/50 px-4 py-2 text-bad hover:bg-bad/10"
          >
            {t.profile.clear}
          </button>
          {cleared && <p role="status" className="text-good">{t.profile.cleared}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setTab("instructions")} className={ghost}>
              {t.common.back}
            </button>
            <button type="button" onClick={() => setTab("review")} className={primary}>
              {t.common.continue}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <dl className="grid gap-3 rounded-xl border border-border bg-surface p-4 text-sm">
            {(
              [
                [t.profile.review.uiLanguage, LANGUAGES[uiLang], "preferences"],
                [t.profile.review.defaultLanguage, t.langNames[language], "preferences"],
                [t.profile.review.styles, styles.map((x) => t.styles[x]).join(", ") || "—", "preferences"],
                [t.profile.review.instructions, instructions || "—", "instructions"],
              ] as const
            ).map(([k, v, tabId]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="flex items-start justify-between gap-2">
                  <span className="break-words">{v}</span>
                  <button type="button" onClick={() => setTab(tabId)} className="shrink-0 text-xs text-accent underline">
                    {t.common.edit}
                  </button>
                </dd>
              </div>
            ))}
          </dl>
          {status}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setTab("privacy")} className={ghost}>
              {t.common.back}
            </button>
            <button type="button" onClick={save} disabled={busy} className={primary}>
              {busy ? t.profile.checking : t.profile.save}
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
