"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LANGUAGES } from "@/lib/profile";
import { fmtTime, loadProfile, loadProgress, type LocalProfile, type Progress } from "@/lib/store";
import type { Manifest } from "@/lib/types";

export default function Library({ allowUpload }: { allowUpload: boolean }) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [upload, setUpload] = useState<{ busy: boolean; msg: string }>({ busy: false, msg: "" });
  const [drag, setDrag] = useState(false);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
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
    });
  }, [refresh]);

  // Poll only while the worker is generating something.
  const processing = manifest?.lectures.some((l) => l.status === "processing");
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
    const { course, exam_date, level, language, styles, instructions } = profile;
    body.append("profile", JSON.stringify({ course, exam_date, level, language, styles, instructions }));
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      setUpload({ busy: false, msg: res.ok ? `${file.name}: generating lessons. This page updates by itself.` : data.error });
      refresh();
    } catch {
      setUpload({ busy: false, msg: "Upload failed. Is the local server running?" });
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <Link href="/dashboard" className="float-right rounded-lg border border-border px-3 py-1.5 text-sm hover:border-accent hover:text-accent">
          My progress
        </Link>
        <p className="text-sm text-muted">
          AI on Campus · {profile?.name ? `Hi ${profile.name}, this is your personal playlist` : "Your personal playlist"}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{manifest?.course.title ?? "Loading…"}</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Upload your lecture slides. Each lecture becomes short narrated lessons with captions, a transcript and
          notes, every claim cited to a slide page and checked by an AI jury. After each lesson, a short check finds
          what you misunderstood.
        </p>
      </header>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
          {profile ? (
            <p className="text-sm">
              <span className="font-medium">Step 1 ✓ Profile:</span> {profile.course} · {profile.level} ·{" "}
              {LANGUAGES[profile.language]}
              {profile.armor && (
                <span className="ml-2 rounded-full bg-good/15 px-2 py-0.5 text-xs text-good">
                  Checked by {profile.armor.engine === "model_armor" ? "Model Armor" : "local guard"}
                </span>
              )}
            </p>
          ) : (
            <p className="text-sm">
              <span className="font-medium">Step 1:</span> tell the tutor about you, your output language and how you learn.
            </p>
          )}
          <Link href="/start" className={profile ? "text-sm text-accent underline" : "rounded-lg bg-accent px-4 py-2 font-medium text-accent-fg"}>
            {profile ? "Edit profile" : "Set up your profile →"}
          </Link>
        </div>

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
        className={`mb-10 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          drag ? "border-accent bg-surface" : "border-border"
        } ${canUpload ? "cursor-pointer hover:border-accent" : "opacity-70"}`}
      >
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={!canUpload || upload.busy}
          onChange={(e) => send(e.target.files)}
        />
        <span className="font-medium">{canUpload ? "Step 2: drop a lecture PDF here, or click to choose" : "Upload lecture slides"}</span>
        <span className="text-sm text-muted">
          {!allowUpload
            ? "Upload works in the local version. This demo shows lessons generated earlier."
            : canUpload
              ? "Slides, exercises or past exams (PDF, max 50 MB)"
              : "Set up your profile first (step 1)."}
        </span>
        {upload.msg && (
          <span role="status" className="mt-2 text-sm">
            {upload.msg}
          </span>
        )}
      </label>

      <section aria-labelledby="lectures">
        <h2 id="lectures" className="mb-4 text-lg font-semibold">
          Lectures
        </h2>
        {manifest && manifest.lectures.length === 0 && <p className="text-muted">No lectures yet.</p>}
        <ol className="space-y-4">
          {manifest?.lectures.map((l) => {
            const done = l.sections.filter((s) => progress[`${l.id}/${s.id}`]?.watched).length;
            return (
              <li key={l.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{l.title}</h3>
                  <span className="text-sm text-muted">
                    {l.status === "processing" && <span className="text-warn">Generating…</span>}
                    {l.status === "failed" && <span className="text-bad">Generation failed</span>}
                    {l.status === "ready" && `${done}/${l.sections.length} watched`}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Source: {l.source}
                  {l.language && ` · ${LANGUAGES[l.language as keyof typeof LANGUAGES] ?? l.language}`}
                </p>
                {l.sections.length > 0 && (
                  <ol className="mt-3 divide-y divide-border">
                    {l.sections.map((s, i) => (
                      <li key={s.id}>
                        <Link
                          href={`/learn/${l.id}/${s.id}`}
                          className="flex items-center gap-3 py-2 hover:text-accent"
                        >
                          <span aria-hidden className="w-6 text-center text-sm text-muted">
                            {progress[`${l.id}/${s.id}`]?.watched ? "✓" : i + 1}
                          </span>
                          <span className="flex-1">{s.title}</span>
                          <span className="text-sm text-muted">{fmtTime(s.duration)}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
