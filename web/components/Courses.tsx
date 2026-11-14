"use client";
import { ArrowRightIcon, BookOpenIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LANGUAGES } from "@/lib/profile";
import { loadProfile, loadProgress, type Progress } from "@/lib/store";
import type { Manifest } from "@/lib/types";

export default function Courses() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/manifest", { cache: "no-store" })
      .then((r) => r.json())
      .then(setManifest)
      .catch(() => setManifest({ courses: [], lectures: [] }))
      .finally(() => {
        setProgress(loadProgress());
        setName(loadProfile()?.name ?? "");
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
              href="/start"
              className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-5 text-center text-muted hover:border-accent hover:text-accent"
            >
              <PlusIcon size={24} aria-hidden />
              <span className="font-medium">Add a course</span>
              <span className="text-sm">Set your profile, then upload the slides.</span>
            </Link>
          </li>
        )}
      </ul>
    </main>
  );
}
