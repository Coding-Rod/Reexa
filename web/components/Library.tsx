"use client";
import { CheckIcon, FileUpIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useT } from "@/components/Lang";
import { courseSlug, isLanguage } from "@/lib/profile";
import { fmtTime, loadCourse, loadLastLesson, loadProfile, loadProgress, uploadLecture, type CourseSettings, type LocalProfile, type Progress } from "@/lib/store";
import type { Manifest } from "@/lib/types";

export default function Library({ allowUpload }: { allowUpload: boolean }) {
  const t = useT();
  const { courseId } = useParams<{ courseId: string }>();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [upload, setUpload] = useState<{ busy: boolean; msg: string }>({ busy: false, msg: "" });
  const [drag, setDrag] = useState(false);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const [settings, setSettings] = useState<CourseSettings | null>(null);
  const canUpload = allowUpload && profile?.armor?.verdict === "pass";

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/manifest", { cache: "no-store" });
      setManifest(await res.json());
    } catch {
      /* keep last manifest */
    }
  }, []);

  useEffect(() => {
    // Fetch on mount; progress lives in localStorage, so read it after mount to match the prerendered HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount is the intended effect
    refresh().then(() => {
      setProgress(loadProgress());
      setProfile(loadProfile());
      setLast(loadLastLesson());
      setSettings(loadCourse(courseId));
    });
  }, [refresh, courseId]);

  // Poll only while the worker is generating something.
  // /course/<id> or /course/<title-slug> (/courses/new links by title before the course has lectures).
  const course = manifest?.courses.find((c) => c.id === courseId || courseSlug(c.title) === courseId);
  const lectures = manifest?.lectures.filter((l) => l.course_id === (course?.id ?? courseId)) ?? [];
  const title = course?.title ?? settings?.title ?? null;
  const processing = lectures.some((l) => l.status === "processing");
  useEffect(() => {
    if (!processing) return;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [processing, refresh]);

  async function send(files: FileList | null) {
    const file = files?.[0];
    if (!file || !canUpload || !profile) return;
    setUpload({ busy: true, msg: t.library.uploading(file.name) });
    // Seeded courses (e.g. db2) have no local settings yet: sensible defaults, profile language.
    const course = settings ?? { title: title ?? courseId, exam_date: null, level: "beginner" as const };
    setUpload({ busy: false, msg: (await uploadLecture(file, course, profile, t.upload)).msg });
    refresh();
  }

  const ready = lectures.filter((l) => l.status === "ready" && l.sections.length);
  const watched = ready.reduce((n, l) => n + l.sections.filter((s) => progress[`${l.id}/${s.id}`]?.watched).length, 0);
  const nextOf = (l: Manifest["lectures"][number]) => l.sections.find((s) => !progress[`${l.id}/${s.id}`]?.watched) ?? l.sections[0];
  const resume = last && ready.some((l) => l.sections.some((s) => `${l.id}/${s.id}` === last)) ? last : ready[0] && `${ready[0].id}/${nextOf(ready[0]).id}`;


  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <header className="mb-6">
        <nav aria-label={t.common.breadcrumb} className="text-sm text-muted">
          <Link href="/" className="hover:text-accent">
            {t.common.courses}
          </Link>{" "}
          › <span aria-current="page">{title ?? courseId}</span>
        </nav>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{manifest ? (title ?? t.library.notFound) : t.common.loading}</h1>
        {course?.term && <p className="mt-1 text-sm text-muted">{course.term}</p>}
        <p className="mt-2 max-w-2xl text-muted">{t.library.intro}</p>
      </header>


      {resume && (
        <Link href={`/learn/${resume}`} className={`${btnPrimary} mb-6`}>
          <PlayIcon size={14} aria-hidden />
          {watched ? t.library.continue : t.library.startLearning}
        </Link>
      )}

      {allowUpload && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            send(e.dataTransfer.files);
          }}
          className={`mb-8 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            drag ? "border-accent bg-accent-soft" : "border-border"
          } ${canUpload ? "cursor-pointer hover:border-accent" : "opacity-70"}`}
        >
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={!canUpload || upload.busy}
            onChange={(e) => send(e.target.files)}
          />
          <FileUpIcon size={22} aria-hidden className="text-muted" />
          <span className="font-medium">{canUpload ? t.library.dropPdf : t.library.setPrefsFirst}</span>
          {!canUpload && (
            <Link href="/profile" className="text-sm text-accent underline">
              {t.common.openProfile}
            </Link>
          )}
          <span className="text-sm text-muted">{t.library.pdfHint}</span>
          {upload.msg && (
            <span role="status" className="mt-2 text-sm">
              {upload.msg}
            </span>
          )}
        </label>
      )}

      <section aria-labelledby="lectures">
        <h2 id="lectures" className="mb-3 text-lg font-semibold">
          {t.library.lectures}
        </h2>
        {!manifest && <p className="text-muted">{t.library.loadingLectures}</p>}
        {manifest && lectures.length === 0 && (
          <p className="rounded-xl border border-border bg-surface p-6 text-muted">
            {t.library.noLectures} {allowUpload ? t.library.uploadAbove : t.library.runLocal}{" "}
            <Link href="/courses/new" className="text-accent underline">
              {t.library.addCourse}
            </Link>
          </p>
        )}
        <ol className="grid gap-4 md:grid-cols-2">
          {lectures.map((l) => {
            const done = l.sections.filter((s) => progress[`${l.id}/${s.id}`]?.watched).length;
            const pct = l.sections.length ? Math.round((done / l.sections.length) * 100) : 0;
            const next = l.sections.length ? nextOf(l) : null;
            const minutes = Math.round(l.sections.reduce((n, s) => n + s.duration, 0) / 60);
            return (
              <li key={l.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold leading-snug">{l.title}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {l.source}
                      {l.language && ` · ${isLanguage(l.language) ? t.langNames[l.language] : l.language}`}
                      {l.sections.length > 0 && ` · ${t.library.lessonsMin(l.sections.length, minutes)}`}
                    </p>
                  </div>
                  {l.status === "processing" && <span className="shrink-0 text-xs font-medium text-warn">{t.library.generating}</span>}
                  {l.status === "failed" && <span className="shrink-0 text-xs font-medium text-bad">{t.library.failed}</span>}
                </div>

                {l.sections.length > 0 && (
                  <>
                    <div className="mt-3 flex items-center gap-2" aria-label={t.library.watchedOf(done, l.sections.length)}>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent-soft">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted">
                        {done}/{l.sections.length}
                      </span>
                    </div>
                    <ol className="mt-3 divide-y divide-border text-sm">
                      {l.sections.map((s, i) => {
                        const seen = progress[`${l.id}/${s.id}`]?.watched;
                        return (
                          <li key={s.id}>
                            <Link href={`/learn/${l.id}/${s.id}`} className="flex items-center gap-3 py-2 hover:text-accent">
                              <span aria-hidden className={`w-5 text-center text-xs ${seen ? "text-good" : "text-muted"}`}>
                                {seen ? <CheckIcon size={14} className="inline" /> : i + 1}
                              </span>
                              <span className="min-w-0 flex-1">{s.title}</span>
                              <span className="font-mono text-xs text-muted">{fmtTime(s.duration)}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ol>
                    {next && l.status === "ready" && (
                      <Link href={`/learn/${l.id}/${next.id}`} className={`${btnPrimary} mt-4 self-start`}>
                        <PlayIcon size={14} aria-hidden />
                        {done === 0 ? t.library.start : done === l.sections.length ? t.library.watchAgain : t.library.continue}
                      </Link>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}

const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-accent-fg hover:opacity-90";
