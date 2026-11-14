"use client";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, ClipboardCheckIcon, FileTextIcon, NotebookPenIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Check from "@/components/Check";
import { AiNotes, JuryBadge, MyNotes } from "@/components/Notes";
import { isLanguage, LANGUAGES } from "@/lib/profile";
import { fmtTime, loadProgress, saveLastLesson, updateProgress, type Progress } from "@/lib/store";
import type { Manifest, PublicSection } from "@/lib/types";

const TABS = ["AI Notes", "My Notes", "Check"] as const;
const TAB_ICON = { "AI Notes": FileTextIcon, "My Notes": NotebookPenIcon, Check: ClipboardCheckIcon };

export default function Player({ lectureId, sectionId }: { lectureId: string; sectionId: string }) {
  const key = `${lectureId}/${sectionId}`;
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [section, setSection] = useState<PublicSection | null>(null);
  const [error, setError] = useState("");
  const [time, setTime] = useState(0);
  const requested = useSearchParams().get("tab");
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS.find((t) => t === requested) ?? "AI Notes");
  const [progress, setProgress] = useState<Progress>({});
  const video = useRef<HTMLVideoElement>(null);
  const transcriptBox = useRef<HTMLOListElement>(null);

  useEffect(() => {
    fetch("/api/manifest").then((r) => r.json()).then(setManifest).catch(() => {});
    fetch(`/api/section/${lectureId}/${sectionId}`)
      .then(async (r) => (r.ok ? setSection(await r.json()) : setError("This lesson was not found.")))
      .catch(() => setError("Could not load this lesson."));
    saveLastLesson(key);
    const sync = () => setProgress(loadProgress());
    sync();
    window.addEventListener("tutor-store", sync);
    return () => window.removeEventListener("tutor-store", sync);
  }, [lectureId, sectionId, key]);

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
  const lecture = manifest?.lectures.find((l) => l.id === lectureId);
  const lectureLang = lecture?.language;
  const flat = playlist.flatMap((l) => l.sections.map((x) => ({ href: `/learn/${l.id}/${x.id}`, key: `${l.id}/${x.id}`, title: x.title })));
  const at = flat.findIndex((f) => f.key === key);
  const prev = at > 0 ? flat[at - 1] : null;
  const next = at >= 0 && at < flat.length - 1 ? flat[at + 1] : null;
  const lang = isLanguage(lectureLang) ? lectureLang : "en";

  return (
    <div className="mx-auto grid w-full max-w-[1600px] gap-5 px-4 py-5 xl:grid-cols-[280px_minmax(0,1fr)_400px]">
      <nav aria-label="Playlist" className="order-4 xl:order-1">
        <div className="space-y-5 rounded-xl border border-border bg-surface p-3 xl:sticky xl:top-[calc(var(--header-h)+1rem)] xl:max-h-[calc(100vh-var(--header-h)-2rem)] xl:overflow-y-auto">
          {playlist.map((l) => {
            const done = l.sections.filter((x) => progress[`${l.id}/${x.id}`]?.watched).length;
            return (
              <div key={l.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2 px-2">
                  <h2 className="text-sm font-semibold">{l.title}</h2>
                  <span className="shrink-0 text-xs text-muted">
                    {done}/{l.sections.length}
                  </span>
                </div>
                <ol className="space-y-0.5">
                  {l.sections.map((x, i) => {
                    const k = `${l.id}/${x.id}`;
                    const current = k === key;
                    const seen = progress[k]?.watched;
                    return (
                      <li key={x.id}>
                        <Link
                          href={`/learn/${l.id}/${x.id}`}
                          aria-current={current ? "page" : undefined}
                          className={`flex items-start gap-2 rounded-lg px-2 py-2 text-sm ${
                            current ? "bg-accent-soft font-medium text-foreground" : "text-muted hover:bg-background hover:text-foreground"
                          }`}
                        >
                          <span aria-hidden className={`mt-0.5 w-4 shrink-0 text-center text-xs ${seen ? "text-good" : ""}`}>
                            {seen ? <CheckIcon size={14} className="inline" /> : i + 1}
                          </span>
                          <span className="min-w-0 flex-1">{x.title}</span>
                          <span className="shrink-0 font-mono text-xs">{fmtTime(x.duration)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
      </nav>

      <main className="order-1 min-w-0 xl:order-2">
        {!section ? (
          <p className="py-16 text-center text-muted">Loading lesson…</p>
        ) : (
          <>
            <nav aria-label="Breadcrumb" className="mb-1 text-sm text-muted">
              <ol className="flex flex-wrap items-center gap-1">
                <li>
                  <Link href="/" className="hover:text-accent">
                    Library
                  </Link>
                </li>
                <li aria-hidden>›</li>
                <li>{lecture?.title ?? lectureId}</li>
                <li aria-hidden className="hidden sm:inline">›</li>
                <li aria-current="page" className="hidden text-foreground sm:inline">
                  {section.title}
                </li>
              </ol>
            </nav>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{section.title}</h1>
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
              className="aspect-video w-full rounded-xl border border-border bg-black"
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onEnded={() => updateProgress(key, (p) => ({ ...p, watched: true }))}
            >
              <source src={section.video} type="video/mp4" />
              <track kind="captions" src={section.captions} srcLang={lang} label={LANGUAGES[lang]} default />
            </video>
            <div className="mt-3 flex items-center justify-between gap-2">
              {prev ? (
                <Link href={prev.href} className={stepBtn} title={prev.title}>
                  <ChevronLeftIcon size={16} aria-hidden />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sr-only sm:hidden">Previous lesson</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link href={next.href} className={`${stepBtn} min-w-0`} title={next.title}>
                  <span className="truncate">
                    <span className="text-muted">Next:</span> {next.title}
                  </span>
                  <ChevronRightIcon size={16} aria-hidden className="shrink-0" />
                </Link>
              )}
            </div>
            <h2 className="mb-2 mt-5 text-sm font-semibold">Transcript</h2>
            <ol ref={transcriptBox} className="max-h-80 space-y-0.5 overflow-y-auto rounded-xl border border-border bg-surface p-2 leading-relaxed">
              {section.transcript.map((c, i) => (
                <li key={i}>
                  <button
                    onClick={() => seek(c.start)}
                    aria-current={i === active ? "true" : undefined}
                    className={`flex w-full gap-3 rounded-md px-2 py-1 text-left ${
                      i === active ? "bg-accent-soft text-foreground" : "text-muted hover:bg-background hover:text-foreground"
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

      <aside className="order-2 min-w-0 xl:sticky xl:top-[calc(var(--header-h)+1rem)] xl:order-3 xl:self-start" aria-label="Notes and check">
        {section && (
          <>
            <div role="tablist" aria-label="Lesson tools" className="flex border-b border-border">
              {TABS.map((t) => {
                const Icon = TAB_ICON[t];
                return (
                  <button
                    key={t}
                    id={`tab-${t}`}
                    role="tab"
                    aria-selected={tab === t}
                    aria-controls="lesson-panel"
                    onClick={() => setTab(t)}
                    className={`relative flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-sm ${
                      tab === t ? "font-medium text-accent" : "text-muted hover:text-foreground"
                    }`}
                  >
                    <Icon size={16} aria-hidden />
                    {t}
                    {tab === t && <span aria-hidden className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-accent" />}
                  </button>
                );
              })}
            </div>
            <div
              id="lesson-panel"
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
              className="rounded-b-xl border border-t-0 border-border bg-surface p-4 xl:max-h-[calc(100vh-var(--header-h)-6rem)] xl:overflow-y-auto"
            >
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

const stepBtn =
  "inline-flex max-w-[70%] items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:border-accent hover:text-accent";
