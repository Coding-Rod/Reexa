"use client";
import { ArrowRightIcon, BookOpenIcon, CheckIcon, PlayIcon, PlusIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LANGUAGES } from "@/lib/profile";
import { useUser } from "@/components/AuthButton";
import { listCourses, loadProfile, loadProgress, type Progress } from "@/lib/store";
import type { Manifest } from "@/lib/types";

export default function Courses() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const name = useUser()?.displayName?.split(" ")[0] ?? "";
  const [hasProfile, setHasProfile] = useState(false);
  const [hasCourse, setHasCourse] = useState(false);

  useEffect(() => {
    fetch("/api/manifest", { cache: "no-store" })
      .then((r) => r.json())
      .then(setManifest)
      .catch(() => setManifest({ courses: [], lectures: [] }))
      .finally(() => {
        setProgress(loadProgress());
        setHasProfile(loadProfile()?.armor?.verdict === "pass");
        setHasCourse(listCourses().length > 0);
      });
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <header className="mb-8">
        <p className="text-sm text-muted">{name ? `Hi ${name}` : "Welcome to Reexa"}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Explore your courses</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Each course turns your slides into short narrated lessons with captions, notes and checks. Every claim cites a
          slide page and is reviewed by a second AI before you see it.
        </p>
      </header>

      {manifest && (
        <ol className="mb-8 grid gap-3 md:grid-cols-3" aria-label="How it works">
          {[
            { n: 1, icon: UserRoundIcon, title: "Your profile", text: "Language, learning style and tutor instructions.", href: "/profile", cta: hasProfile ? "Edit profile" : "Set up profile", done: hasProfile },
            { n: 2, icon: PlusIcon, title: "Add a course", text: "Name it, set your exam date and add the slides.", href: "/courses/new", cta: "Add a course", done: hasCourse || manifest.courses.length > 0 },
            { n: 3, icon: PlayIcon, title: "Learn and check", text: "Watch, take notes, then prove it in the check.", href: manifest.courses[0] ? `/course/${manifest.courses[0].id}` : "/courses/new", cta: "Open a course", done: Object.values(progress).some((p) => p.watched) },
          ].map(({ n, icon: Icon, title, text, href, cta, done }) => (
            <li key={n} className={`flex flex-col gap-2 rounded-xl border bg-surface p-4 ${done ? "border-border" : "border-accent/40"}`}>
              <div className="flex items-center gap-2">
                <span aria-hidden className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-good/15 text-good" : "bg-accent-soft text-accent"}`}>
                  {done ? <CheckIcon size={14} /> : n}
                </span>
                <h2 className="font-semibold">{title}</h2>
                <Icon size={16} aria-hidden className="ml-auto text-muted" />
                <span className="sr-only">{done ? "done" : "to do"}</span>
              </div>
              <p className="text-sm text-muted">{text}</p>
              <Link href={href} className="mt-auto pt-1 text-sm text-accent underline-offset-2 hover:underline">
                {cta}
              </Link>
            </li>
          ))}
        </ol>
      )}

      {!manifest && <p className="text-muted">Loading courses…</p>}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {manifest?.courses.map((c) => {
          const lectures = manifest.lectures.filter((l) => l.course_id === c.id);
          const sections = lectures.flatMap((l) => l.sections.map((s) => ({ key: `${l.id}/${s.id}`, d: s.duration })));
          const watched = sections.filter((s) => progress[s.key]?.watched).length;
          const pct = sections.length ? Math.round((watched / sections.length) * 100) : 0;
          const minutes = Math.round(sections.reduce((n, s) => n + s.d, 0) / 60);
          const langs = [...new Set(lectures.map((l) => l.language).filter(Boolean))] as string[];
          const generating = lectures.some((l) => l.status === "processing");
          return (
            <li key={c.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start gap-3">
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                  <BookOpenIcon size={20} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold leading-snug">{c.title}</h2>
                  {c.term && <p className="truncate text-xs text-muted">{c.term}</p>}
                </div>
              </div>
              {c.description && <p className="mt-3 text-sm text-muted">{c.description}</p>}
              <p className="mt-3 text-xs text-muted">
                {lectures.length} lecture{lectures.length === 1 ? "" : "s"} · {sections.length} lesson{sections.length === 1 ? "" : "s"} · {minutes} min
                {generating && <span className="ml-1 font-medium text-warn">· generating…</span>}
              </p>
              {langs.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1">
                  {langs.map((l) => (
                    <span key={l} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                      {LANGUAGES[l as keyof typeof LANGUAGES] ?? l}
                    </span>
                  ))}
                </p>
              )}
              <div className="mt-4 flex items-center gap-2" aria-label={`${watched} of ${sections.length} lessons watched`}>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent-soft">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted">{pct}%</span>
              </div>
              <Link
                href={`/course/${c.id}`}
                className="mt-4 inline-flex items-center gap-1.5 self-start rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
              >
                Open <ArrowRightIcon size={14} aria-hidden />
              </Link>
            </li>
          );
        })}

        {manifest && (
          <li>
            <Link
              href="/courses/new"
              className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-5 text-center text-muted hover:border-accent hover:text-accent"
            >
              <PlusIcon size={24} aria-hidden />
              <span className="font-medium">Add a course</span>
              <span className="text-sm">Name it, set the exam date and add the slides.</span>
            </Link>
          </li>
        )}
      </ul>
    </main>
  );
}
