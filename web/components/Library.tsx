"use client";
import { CheckIcon, FileUpIcon, PlayIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { courseSlug, LANGUAGES } from "@/lib/profile";
import { fmtTime, loadLastLesson, loadProfile, loadProgress, type LocalProfile, type Progress } from "@/lib/store";
import type { Manifest } from "@/lib/types";

export default function Library({ allowUpload }: { allowUpload: boolean }) {
  const { courseId } = useParams<{ courseId: string }>();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [upload, setUpload] = useState<{ busy: boolean; msg: string }>({ busy: false, msg: "" });
  const [drag, setDrag] = useState(false);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [last, setLast] = useState<string | null>(null);
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
    });
  }, [refresh]);

  // Poll only while the worker is generating something.
  // /course/<id> or /course/<title-slug> (the profile form links by title before the course exists).
  const course = manifest?.courses.find((c) => c.id === courseId || courseSlug(c.title) === courseId);
  const lectures = manifest?.lectures.filter((l) => l.course_id === (course?.id ?? courseId)) ?? [];
  const title = course?.title ?? (profile && courseSlug(profile.course) === courseId ? profile.course : null);
  const processing = lectures.some((l) => l.status === "processing");
  useEffect(() => {
    if (!processing) return;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [processing, refresh]);

  async function send(files: FileList | null) {
    const file = files?.[0];
    if (!file || !canUpload || !profile) return;
    setUpload({ busy: true, msg: `Uploading ${file.name}…` });
    const body = new FormData();
    body.append("file", file);
    // Name stays in the browser; the server re-checks the rest.
    // Uploads from a course page land in that course.
    const { exam_date, level, language, styles, instructions } = profile;
    body.append("profile", JSON.stringify({ course: title ?? profile.course, exam_date, level, language, styles, instructions }));
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      setUpload({ busy: false, msg: res.ok ? `${file.name}: generating lessons. This page updates by itself.` : data.error });
      refresh();
    } catch {
      setUpload({ busy: false, msg: "Upload failed. Is the local server running?" });
    }
  }

  const ready = lectures.filter((l) => l.status === "ready" && l.sections.length);
  const total = ready.reduce((n, l) => n + l.sections.length, 0);
  const watched = ready.reduce((n, l) => n + l.sections.filter((s) => progress[`${l.id}/${s.id}`]?.watched).length, 0);
  const nextOf = (l: Manifest["lectures"][number]) => l.sections.find((s) => !progress[`${l.id}/${s.id}`]?.watched) ?? l.sections[0];
  const resume = last && ready.some((l) => l.sections.some((s) => `${l.id}/${s.id}` === last)) ? last : ready[0] && `${ready[0].id}/${nextOf(ready[0]).id}`;

  const steps = [
    {
      n: 1,
      icon: UserRoundIcon,
      title: "Your profile",
      done: !!profile,
      text: profile
        ? `${profile.course} · ${profile.level} · ${LANGUAGES[profile.language]}`
        : "Level, output language and how you like to learn.",
      action: (
        <Link href="/start" className={profile ? "text-sm text-accent underline-offset-2 hover:underline" : btnPrimary}>
          {profile ? "Edit profile" : "Set up profile"}
        </Link>
      ),
    },
    {
      n: 2,
      icon: FileUpIcon,
      title: "Upload slides",
      done: ready.length > 0,
      text: allowUpload ? "Drop a lecture PDF below. Lessons appear as they render." : "Upload runs in the local version. This site shows lessons generated earlier.",
      action: null,
    },
    {
      n: 3,
      icon: PlayIcon,
      title: "Learn and check",
      done: total > 0 && watched === total,
      text: total ? `${watched} of ${total} lessons watched` : "Watch, take notes, then prove it in the check.",
      action: resume ? (
        <Link href={`/learn/${resume}`} className={btnPrimary}>
          {watched ? "Continue" : "Start learning"}
        </Link>
      ) : null,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <header className="mb-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/" className="hover:text-accent">
            Courses
          </Link>{" "}
          › <span aria-current="page">{title ?? courseId}</span>
        </nav>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{manifest ? (title ?? "Course not found") : "Loading…"}</h1>
        {course?.term && <p className="mt-1 text-sm text-muted">{course.term}</p>}
        <p className="mt-2 max-w-2xl text-muted">
          Each lecture becomes short narrated lessons with captions, a transcript and notes. Every claim cites a slide
          page and is checked by a second AI before you see it.
        </p>
      </header>

      <ol className="mb-8 grid gap-3 md:grid-cols-3" aria-label="How it works">
        {steps.map(({ n, icon: Icon, title, done, text, action }) => (
          <li key={n} className={`flex flex-col gap-2 rounded-xl border bg-surface p-4 ${done ? "border-border" : "border-accent/40"}`}>
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-good/15 text-good" : "bg-accent-soft text-accent"}`}
              >
                {done ? <CheckIcon size={14} /> : n}
              </span>
              <h2 className="font-semibold">{title}</h2>
              <Icon size={16} aria-hidden className="ml-auto text-muted" />
              <span className="sr-only">{done ? "done" : "to do"}</span>
            </div>
            <p className="text-sm text-muted">{text}</p>
            {action && <div className="mt-auto pt-1">{action}</div>}
          </li>
        ))}
      </ol>

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
          <span className="font-medium">{canUpload ? "Drop a lecture PDF here, or click to choose" : "Set up your profile first"}</span>
          <span className="text-sm text-muted">Slides, exercises or past exams · PDF · max 50 MB</span>
          {upload.msg && (
            <span role="status" className="mt-2 text-sm">
              {upload.msg}
            </span>
          )}
        </label>
      )}

      <section aria-labelledby="lectures">
        <h2 id="lectures" className="mb-3 text-lg font-semibold">
          Lectures
        </h2>
        {!manifest && <p className="text-muted">Loading lectures…</p>}
        {manifest && lectures.length === 0 && (
          <p className="rounded-xl border border-border bg-surface p-6 text-muted">
            No lectures yet. {allowUpload ? "Upload a PDF above to generate your first lessons." : "Run the local version to upload slides."}
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
                      {l.language && ` · ${LANGUAGES[l.language as keyof typeof LANGUAGES] ?? l.language}`}
                      {l.sections.length > 0 && ` · ${l.sections.length} lesson${l.sections.length === 1 ? "" : "s"} · ${minutes} min`}
                    </p>
                  </div>
                  {l.status === "processing" && <span className="shrink-0 text-xs font-medium text-warn">Generating…</span>}
                  {l.status === "failed" && <span className="shrink-0 text-xs font-medium text-bad">Failed</span>}
                </div>

                {l.sections.length > 0 && (
                  <>
                    <div className="mt-3 flex items-center gap-2" aria-label={`${done} of ${l.sections.length} watched`}>
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
                        {done === 0 ? "Start" : done === l.sections.length ? "Watch again" : "Continue"}
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
