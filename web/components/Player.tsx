"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Check from "@/components/Check";
import { AiNotes, JuryBadge, MyNotes } from "@/components/Notes";
import { isLanguage, LANGUAGES } from "@/lib/profile";
import { fmtTime, loadProgress, updateProgress, type Progress } from "@/lib/store";
import type { Manifest, PublicSection } from "@/lib/types";

const TABS = ["AI Notes", "My Notes", "Check"] as const;

export default function Player({ lectureId, sectionId }: { lectureId: string; sectionId: string }) {
  const key = `${lectureId}/${sectionId}`;
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [section, setSection] = useState<PublicSection | null>(null);
  const [error, setError] = useState("");
  const [time, setTime] = useState(0);
  const [tab, setTab] = useState<(typeof TABS)[number]>("AI Notes");
  const [progress, setProgress] = useState<Progress>({});
  const video = useRef<HTMLVideoElement>(null);
  const transcriptBox = useRef<HTMLOListElement>(null);

  useEffect(() => {
    fetch("/api/manifest").then((r) => r.json()).then(setManifest).catch(() => {});
    fetch(`/api/section/${lectureId}/${sectionId}`)
      .then(async (r) => (r.ok ? setSection(await r.json()) : setError("This lesson was not found.")))
      .catch(() => setError("Could not load this lesson."));
    const sync = () => setProgress(loadProgress());
    sync();
    window.addEventListener("tutor-store", sync);
    return () => window.removeEventListener("tutor-store", sync);
  }, [lectureId, sectionId]);

  const seek = (t: number) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = t;
    v.play().catch(() => {});
  };
  const getTime = () => video.current?.currentTime ?? 0;

  const active = section?.transcript.findIndex((c) => time >= c.start && time < c.end) ?? -1;
  useEffect(() => {
    // Scroll inside the transcript panel only, never the page.
    const box = transcriptBox.current;
    const el = box?.children[active] as HTMLElement | undefined;
    if (box && el) box.scrollTo({ top: el.offsetTop - box.offsetTop - box.clientHeight / 3, behavior: "smooth" });
  }, [active]);

  if (error)
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <p>{error}</p>
        <Link href="/" className="text-accent underline">
          Back to the library
        </Link>
      </main>
    );

  const playlist = manifest?.lectures.filter((l) => l.status === "ready") ?? [];
  const lectureLang = manifest?.lectures.find((l) => l.id === lectureId)?.language;
  const lang = isLanguage(lectureLang) ? lectureLang : "en";

  return (
    <div className="mx-auto grid w-full max-w-[1600px] gap-4 px-4 py-4 xl:grid-cols-[260px_minmax(0,1fr)_400px]">
      <nav aria-label="Playlist" className="order-4 xl:order-1">
        <Link href="/" className="mb-3 inline-block text-sm text-muted hover:text-accent">
          ← Library
        </Link>
        <div className="space-y-4 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto">
          {playlist.map((l) => (
            <div key={l.id}>
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{l.title}</h2>
              <ol>
                {l.sections.map((s) => {
                  const k = `${l.id}/${s.id}`;
                  const current = k === key;
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/learn/${l.id}/${s.id}`}
                        aria-current={current ? "page" : undefined}
                        className={`flex gap-2 rounded-md px-2 py-1.5 text-sm ${
                          current ? "bg-accent text-accent-fg" : "hover:bg-surface"
                        }`}
                      >
                        <span aria-hidden className="w-4">
                          {progress[k]?.watched ? "✓" : "•"}
                        </span>
                        <span className="flex-1">{s.title}</span>
                        <span className={current ? "" : "text-muted"}>{fmtTime(s.duration)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </nav>

      <main className="order-1 min-w-0 xl:order-2">
        {!section ? (
          <p className="py-16 text-center text-muted">Loading lesson…</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl font-semibold">{section.title}</h1>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted" title="Lesson language">
                  {LANGUAGES[lang]}
                </span>
                <JuryBadge jury={section.jury} />
              </div>
            </div>
            <video
              ref={video}
              controls
              preload="metadata"
              crossOrigin="anonymous"
              className="aspect-video w-full rounded-xl bg-black"
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onEnded={() => updateProgress(key, (p) => ({ ...p, watched: true }))}
            >
              <source src={section.video} type="video/mp4" />
              <track kind="captions" src={section.captions} srcLang={lang} label={LANGUAGES[lang]} default />
            </video>
            <h2 className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-muted">Transcript</h2>
            <ol ref={transcriptBox} className="max-h-72 overflow-y-auto rounded-xl border border-border bg-surface p-2">
              {section.transcript.map((c, i) => (
                <li key={i}>
                  <button
                    onClick={() => seek(c.start)}
                    aria-current={i === active ? "true" : undefined}
                    className={`flex w-full gap-3 rounded-md px-2 py-1 text-left ${
                      i === active ? "bg-accent/15 font-medium" : "hover:bg-background"
                    }`}
                  >
                    <span className="w-10 shrink-0 font-mono text-xs leading-6 text-muted">{fmtTime(c.start)}</span>
                    <span>{c.text}</span>
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}
      </main>

      <aside className="order-2 min-w-0 xl:order-3" aria-label="Notes and check">
        {section && (
          <>
            <div role="tablist" aria-label="Lesson tools" className="mb-3 flex gap-1 rounded-lg border border-border bg-surface p-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm ${tab === t ? "bg-accent text-accent-fg" : "hover:bg-background"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div role="tabpanel" className="rounded-xl border border-border bg-surface p-4 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
              {tab === "AI Notes" && <AiNotes section={section} />}
              {tab === "My Notes" && <MyNotes sectionKey={key} getTime={getTime} seek={seek} />}
              {tab === "Check" && <Check section={section} sectionKey={key} />}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
