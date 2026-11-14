"use client";
import { useUser } from "@/components/AuthButton";
import Link from "next/link";
import { useEffect, useState } from "react";
import { listCourses, loadProgress, type CourseSettings, type Progress } from "@/lib/store";
import type { Manifest, PublicSection } from "@/lib/types";

type Status = "gap" | "closed" | "new";
type Row = { courseId: string; courseTitle: string; lectureId: string; lectureTitle: string; sectionId: string; sectionTitle: string; concepts: string[] };

const CHIP: Record<Status, string> = {
  gap: "bg-warn/15 text-warn",
  closed: "bg-good/15 text-good",
  new: "bg-surface text-muted border border-border",
};
const LABEL: Record<Status, string> = { gap: "gap", closed: "closed", new: "not started" };

function daysLeft(date?: string | null) {
  if (!date) return null;
  const exam = new Date(`${date}T00:00:00`);
  if (Number.isNaN(exam.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((exam.getTime() - today.getTime()) / 86_400_000);
}

export default function Dashboard() {
  const firstName = useUser()?.displayName?.split(" ")[0];
  const [rows, setRows] = useState<Row[] | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [courseSettings, setCourseSettings] = useState<CourseSettings[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const m: Manifest = await (await fetch("/api/manifest", { cache: "no-store" })).json();
        const refs = m.lectures
          .filter((l) => l.status === "ready")
          .flatMap((l) => l.sections.map((s) => ({ l, s })));
        // ponytail: one request per section; a summary endpoint if courses grow past ~50 sections
        const out = await Promise.all(
          refs.map(async ({ l, s }) => {
            const r = await fetch(`/api/section/${l.id}/${s.id}`);
            const sec: PublicSection | null = r.ok ? await r.json() : null;
            const concepts = [...new Set((sec?.quiz ?? []).map((q) => q.concept))];
            const course = m.courses.find((c) => c.id === l.course_id);
            return { courseId: l.course_id, courseTitle: course?.title ?? l.course_id, lectureId: l.id, lectureTitle: l.title, sectionId: s.id, sectionTitle: s.title, concepts };
          }),
        );
        setRows(out);
      } catch {
        setRows([]);
      }
    })();
    const sync = () => {
      setProgress(loadProgress());
      setCourseSettings(listCourses());
    };
    sync();
    window.addEventListener("tutor-store", sync);
    return () => window.removeEventListener("tutor-store", sync);
  }, []);

  if (!rows) return <p className="py-16 text-center text-muted">Loading your progress…</p>;

  const status = (r: Row, c: string): Status => progress[`${r.lectureId}/${r.sectionId}`]?.concepts?.[c] ?? "new";
  const watched = rows.filter((r) => progress[`${r.lectureId}/${r.sectionId}`]?.watched).length;
  const all = rows.flatMap((r) => r.concepts.map((c) => ({ r, c, s: status(r, c) })));
  const seen = all.filter((x) => x.s !== "new");
  const closed = all.filter((x) => x.s === "closed").length;
  const gap = all.find((x) => x.s === "gap");
  const unwatched = rows.find((r) => !progress[`${r.lectureId}/${r.sectionId}`]?.watched);
  // Exam dates are per course: show the next upcoming one.
  const exam = courseSettings
    .map((c) => ({ title: c.title, days: daysLeft(c.exam_date) }))
    .filter((c): c is { title: string; days: number } => c.days !== null && c.days >= 0)
    .sort((a, b) => a.days - b.days)[0];
  const days = exam?.days ?? null;
  const nothing = watched === 0 && seen.length === 0;
  const courses = [...new Set(rows.map((r) => r.courseId))];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          {firstName ? `${firstName}'s progress` : "My progress"}
        </h1>
        {days !== null && (
          <p className="mt-1 text-muted">
            {days > 0 ? `${days} day${days === 1 ? "" : "s"} until your ${exam!.title} exam` : `Your ${exam!.title} exam is today. Good luck!`}
          </p>
        )}
      </header>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-muted">
          No lessons yet.{" "}
          <Link href="/" className="text-accent underline">
            Upload your slides
          </Link>{" "}
          to build your playlist.
        </p>
      ) : (
        <>
          <section aria-label="Overview" className="mb-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Lessons watched" value={`${watched} / ${rows.length}`} />
            <Stat label="Concepts closed" value={`${closed} / ${seen.length}`} />
            <Stat label="Open gaps" value={String(all.filter((x) => x.s === "gap").length)} />
          </section>

          <section aria-label="Study next" className="mb-8 rounded-xl border-2 border-accent/50 bg-surface p-4">
            <p className="text-sm font-semibold text-accent">Study next</p>
            {nothing ? (
              <p className="mt-1">
                Start with your first lesson:{" "}
                <Link href={`/learn/${rows[0].lectureId}/${rows[0].sectionId}`} className="font-medium text-accent underline">
                  {rows[0].sectionTitle}
                </Link>
              </p>
            ) : gap ? (
              <p className="mt-1">
                Close your gap on <span className="font-medium">{gap.c}</span> in{" "}
                <Link href={`/learn/${gap.r.lectureId}/${gap.r.sectionId}?tab=Check`} className="font-medium text-accent underline">
                  {gap.r.sectionTitle}
                </Link>
              </p>
            ) : unwatched ? (
              <p className="mt-1">
                Next lesson:{" "}
                <Link href={`/learn/${unwatched.lectureId}/${unwatched.sectionId}`} className="font-medium text-accent underline">
                  {unwatched.sectionTitle}
                </Link>
              </p>
            ) : (
              <p className="mt-1">Everything watched and no open gaps. Re-take a check to stay sharp.</p>
            )}
          </section>

          <section aria-label="Concepts">
            <h2 className="mb-3 text-lg font-semibold">Concepts</h2>
            <div className="space-y-8">
              {courses.map((cid) => {
                const cr = rows.filter((r) => r.courseId === cid);
                return (
                  <div key={cid}>
                    <h3 className="mb-3 font-semibold">
                      <Link href={`/course/${cid}`} className="hover:text-accent">
                        {cr[0].courseTitle}
                      </Link>
                    </h3>
                    <div className="space-y-6">
              {[...new Set(cr.map((r) => r.lectureId))].map((id) => {
                const lr = cr.filter((r) => r.lectureId === id);
                return (
                  <div key={id}>
                    <h4 className="mb-2 font-medium">{lr[0].lectureTitle}</h4>
                    <ul className="space-y-2">
                      {lr.map((r) => (
                        <li key={r.sectionId} className="rounded-lg border border-border bg-surface p-3">
                          <Link href={`/learn/${r.lectureId}/${r.sectionId}?tab=Check`} className="text-sm font-medium hover:text-accent">
                            {r.sectionTitle}
                          </Link>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {r.concepts.length === 0 && <span className="text-xs text-muted">No check questions yet</span>}
                            {r.concepts.map((c) => {
                              const s = status(r, c);
                              return (
                                <span key={c} className={`rounded-full px-2.5 py-0.5 text-xs ${CHIP[s]}`}>
                                  {c} · {LABEL[s]}
                                </span>
                              );
                            })}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
