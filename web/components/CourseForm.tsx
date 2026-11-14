"use client";
import { confirmToast } from "@/lib/toast";
import { FileUpIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/components/Lang";
import { input } from "@/components/ProfileForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { courseSlug, LANGUAGES, LEVELS, LIMITS, type Language, type Level } from "@/lib/profile";
import { clearDraft, loadDraft, loadProfile, saveCourse, saveDraft, uploadLecture, type LocalProfile } from "@/lib/store";

const TABS = ["course", "language", "materials", "review"] as const;
type Tab = (typeof TABS)[number];
const ghost = "rounded-lg border border-border px-4 py-2 hover:border-accent";
const KINDS = ["slides", "notes", "exams", "exercises", "other"] as const;
type Kind = (typeof KINDS)[number];
type Picked = { file: File; kind: Kind };
type Draft = { tab: Tab; title: string; examDate: string; level: Level; language: Language | ""; fileNames: string[] };
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);
const primary = "ml-auto rounded-lg bg-accent px-4 py-2 font-medium text-accent-fg disabled:opacity-50";

export default function CourseForm({ allowUpload }: { allowUpload: boolean }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>("course");
  const [title, setTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [level, setLevel] = useState<Level>("beginner");
  const [language, setLanguage] = useState<Language | "">(""); // "" = profile default
  const [files, setFiles] = useState<Picked[]>([]); // all kinds optional, at least one file in total
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [restored, setRestored] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [missingFiles, setMissingFiles] = useState<string[]>([]);
  const [dragKind, setDragKind] = useState<Kind | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage */
    setProfile(loadProfile());
    const d = loadDraft<Draft>("course");
    if (d) {
      setTab(d.tab);
      setTitle(d.title);
      setExamDate(d.examDate);
      setLevel(d.level);
      setLanguage(d.language);
      setMissingFiles(d.fileNames);
    }
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Autosave on every change (after the draft was restored, so we don't overwrite it with defaults).
  useEffect(() => {
    if (!restored || done) return;
    const names = files.length ? files.map((f) => f.file.name) : missingFiles;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflects the storage write result
    setDraftSaved(saveDraft("course", { tab, title, examDate, level, language, fileNames: names } satisfies Draft));
  }, [restored, done, tab, title, examDate, level, language, files, missingFiles]);

  function startOver() {
    confirmToast(t.courseForm.startOverConfirm, t.toast, () => {
      clearDraft("course");
      setTab("course");
      setTitle("");
      setExamDate("");
      setLevel("beginner");
      setLanguage("");
      setFiles([]);
      setMissingFiles([]);
      setError("");
      setLog([]);
      setDone(false);
    }, t.toast.startedOver);
  }


  function addFiles(list: FileList | null, kind: Kind) {
    const add = [...(list ?? [])]
      .filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))
      .map((file) => ({ file, kind }));
    if (!add.length) return;
    setFiles((cur) => [...cur.filter((f) => !add.some((a) => a.file.name === f.file.name)), ...add]);
    setMissingFiles([]);
  }

  const profileOk = profile?.armor?.verdict === "pass";
  const slug = courseSlug(title);
  const step = (id: Tab, d: number) => TABS[TABS.indexOf(id) + d];

  async function save() {
    setError("");
    if (!title.trim()) {
      setError(t.courseForm.needName);
      return setTab("course");
    }
    if (!files.length) {
      setError(t.courseForm.needFiles);
      return setTab("materials");
    }
    if (!profileOk) return setError(t.courseForm.needProfile);
    setBusy(true);
    const settings = { title: title.trim().slice(0, LIMITS.course), exam_date: examDate || null, level, ...(language ? { language } : {}) };
    saveCourse(slug, settings);
    const out: string[] = [];
    for (const f of files) out.push((await uploadLecture(f.file, settings, profile!, t.upload, f.kind)).msg);
    setLog(out);
    setBusy(false);
    setDone(true);
    clearDraft("course");
  }

  const nav = (id: Tab) => (
    <div className="flex gap-2 pt-2">
      {step(id, -1) && (
        <button type="button" onClick={() => setTab(step(id, -1))} className={ghost}>
          {t.common.back}
        </button>
      )}
      <button type="button" onClick={() => setTab(step(id, 1))} className={primary}>
        {t.common.continue}
      </button>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <nav aria-label={t.common.breadcrumb} className="text-sm text-muted">
        <Link href="/" className="hover:text-accent">
          {t.common.courses}
        </Link>{" "}
        › <span aria-current="page">{t.courseForm.title}</span>
      </nav>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t.courseForm.title}</h1>
      <p className="mt-2 text-muted">{t.courseForm.intro}</p>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <span aria-live="polite" className="text-muted">
          {draftSaved && !done ? t.common.draftSaved : ""}
        </span>
        <button type="button" onClick={startOver} className="ml-auto text-muted underline hover:text-accent">
          {t.common.startOver}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-bad/40 bg-bad/10 p-3 text-sm text-bad">
          {error}{" "}
          {!profileOk && (
            <Link href="/profile" className="underline">
              {t.common.openProfile}
            </Link>
          )}
        </p>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-6">
        <TabsList variant="line">
          {TABS.map((id, i) => (
            <TabsTrigger key={id} value={id}>
              <span className="text-xs text-muted">{i + 1}</span> {t.courseForm.tabs[id]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="course" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="course" className="mb-1 block font-medium">
                {t.courseForm.name}
              </label>
              <input id="course" className={input} maxLength={LIMITS.course} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.courseForm.namePlaceholder} />
            </div>
            <div>
              <label htmlFor="exam" className="mb-1 block font-medium">
                {t.courseForm.examDate} <span className="text-sm font-normal text-muted">{t.common.optional}</span>
              </label>
              <input id="exam" type="date" className={input} value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
          </div>
          <fieldset>
            <legend className="mb-2 font-medium">{t.courseForm.level}</legend>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <label
                  key={l}
                  className={`cursor-pointer rounded-full border px-4 py-1.5 capitalize has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${level === l ? "border-accent bg-accent-soft" : "border-border"}`}
                >
                  <input type="radio" name="level" value={l} checked={level === l} onChange={() => setLevel(l)} className="sr-only" />
                  {t.levels[l]}
                </label>
              ))}
            </div>
          </fieldset>
          {nav("course")}
        </TabsContent>

        <TabsContent value="language" className="space-y-6">
          <div>
            <label htmlFor="language" className="mb-1 block font-medium">
              {t.courseForm.outputLanguage}
            </label>
            <select id="language" className={input} value={language} onChange={(e) => setLanguage(e.target.value as Language | "")}>
              <option value="">{t.courseForm.profileDefault(profile ? t.langNames[profile.language] : null)}</option>
              {(Object.keys(LANGUAGES) as Language[]).map((code) => (
                <option key={code} value={code}>
                  {t.langNames[code]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-muted">{t.courseForm.languageHint}</p>
          </div>
          {nav("language")}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <p className="text-sm text-muted">{t.courseForm.materialsIntro}</p>
          {!allowUpload && <p className="rounded-xl border border-border bg-surface p-3 text-sm text-muted">{t.courseForm.localOnly}</p>}
          {missingFiles.length > 0 && files.length === 0 && (
            <p role="status" className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm">
              {t.courseForm.missingFiles(missingFiles.join(", "))}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {KINDS.map((kind) => {
              const mine = files.filter((f) => f.kind === kind);
              return (
                <div key={kind} className="flex flex-col rounded-xl border border-border bg-surface p-3">
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragKind(kind);
                    }}
                    onDragLeave={() => setDragKind(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragKind(null);
                      addFiles(e.dataTransfer.files, kind);
                    }}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 border-dashed p-3 transition-colors hover:border-accent has-[:focus-visible]:border-accent ${
                      dragKind === kind ? "border-accent bg-accent-soft" : "border-border"
                    }`}
                  >
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        addFiles(e.target.files, kind);
                        e.target.value = "";
                      }}
                    />
                    <FileUpIcon size={20} aria-hidden className="mt-0.5 shrink-0 text-muted" />
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {t.courseForm.kinds[kind]} <span className="text-xs font-normal text-muted">{t.common.optional}</span>
                      </span>
                      <span className="block text-xs text-muted">{t.courseForm.kindHints[kind]}</span>
                      <span className="mt-1 block text-xs text-accent">{t.courseForm.dropHint}</span>
                    </span>
                  </label>
                  {mine.length > 0 && (
                    <ul className="mt-2 divide-y divide-border text-sm" aria-label={`${t.courseForm.selectedFiles}: ${t.courseForm.kinds[kind]}`}>
                      {mine.map((f) => (
                        <li key={f.file.name} className="flex items-center gap-2 py-1.5">
                          <span className="min-w-0 flex-1 truncate">{f.file.name}</span>
                          <span className="text-xs text-muted">{kb(f.file.size)}</span>
                          <button
                            type="button"
                            onClick={() => setFiles((cur) => cur.filter((x) => x !== f))}
                            className="text-xs text-bad underline"
                            aria-label={t.courseForm.removeFile(f.file.name)}
                          >
                            {t.courseForm.remove}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted">{t.courseForm.pdfHint}</p>
          {nav("materials")}
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <dl className="grid gap-3 rounded-xl border border-border bg-surface p-4 text-sm sm:grid-cols-2">
            {(
              [
                [t.courseForm.review.course, title || "—", "course"],
                [t.courseForm.review.examDate, examDate || "—", "course"],
                [t.courseForm.review.level, t.levels[level], "course"],
                [t.courseForm.review.language, language ? t.langNames[language] : t.courseForm.profileDefault(profile ? t.langNames[profile.language] : null), "language"],
                [
                  t.courseForm.review.materials,
                  files.length
                    ? KINDS.filter((k) => files.some((f) => f.kind === k))
                        .map((k) => `${t.courseForm.kinds[k]}: ${files.filter((f) => f.kind === k).length}`)
                        .join(" · ")
                    : t.courseForm.noneYet,
                  "materials",
                ],
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
          {done ? (
            <div role="status" className="space-y-2 rounded-lg border border-good/40 bg-good/10 p-3 text-sm">
              <p className="font-medium text-good">{t.courseForm.saved}</p>
              {log.map((m) => (
                <p key={m}>{m}</p>
              ))}
              <Link href={`/course/${slug}`} className="inline-flex rounded-lg bg-accent px-3.5 py-2 font-medium text-accent-fg">
                {t.courseForm.goTo(title)}
              </Link>
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setTab("materials")} className={ghost}>
                {t.common.back}
              </button>
              <button type="button" onClick={save} disabled={busy} className={primary}>
                {busy ? t.courseForm.creating : t.courseForm.create}
              </button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
