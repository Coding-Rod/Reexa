import "server-only";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { courseSlug } from "./profile";
import type { Explain, Manifest, PublicSection, QuizItem, Section } from "./types";

export const CONTENT_DIR = path.join(process.cwd(), "public", "content");
export const REPO_ROOT = path.resolve(process.cwd(), "..");

// Trust boundary: ids come from the URL / request body and become file paths.
const ID = /^[A-Za-z0-9_-]{1,80}$/;
export const isId = (s: unknown): s is string => typeof s === "string" && ID.test(s);

const DEFAULT_COURSE = { id: "db2", title: "Databases 2" };

// Backward compatible: old manifests have one `course` and lectures without `course_id`.
export function normalizeManifest(raw: Partial<Manifest>): Manifest {
  const fallback = raw.course ?? DEFAULT_COURSE;
  const courses = raw.courses?.length ? [...raw.courses] : [fallback];
  const lectures = (raw.lectures ?? []).map((l) => ({ ...l, course_id: l.course_id || fallback.id }));
  for (const l of lectures)
    if (!courses.some((c) => c.id === l.course_id)) courses.push({ id: l.course_id, title: l.course_id });
  return { courses, lectures };
}

// Same rule as worker/pipeline.py course_for(): reuse a course with the same title, else slug the title.
export function upsertCourse(m: Manifest, title: string): string {
  const t = title.trim() || DEFAULT_COURSE.title;
  const hit = m.courses.find((c) => c.title.toLowerCase() === t.toLowerCase());
  if (hit) return hit.id;
  const id = courseSlug(t);
  if (!m.courses.some((c) => c.id === id)) m.courses.push({ id, title: t });
  return id;
}

export async function readManifest(): Promise<Manifest> {
  try {
    return normalizeManifest(JSON.parse(await readFile(path.join(CONTENT_DIR, "manifest.json"), "utf8")));
  } catch {
    return normalizeManifest({});
  }
}

export async function writeManifest(m: Manifest) {
  await mkdir(CONTENT_DIR, { recursive: true });
  await writeFile(path.join(CONTENT_DIR, "manifest.json"), JSON.stringify(m, null, 2));
}

export async function readSection(lectureId: string, sectionId: string): Promise<Section | null> {
  if (!isId(lectureId) || !isId(sectionId)) return null;
  try {
    const file = path.join(CONTENT_DIR, lectureId, sectionId, "section.json");
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

export const publicQuestion = (q: QuizItem) => ({
  id: q.id,
  concept: q.concept,
  question: q.question,
  options: q.options,
});

export function toPublic(s: Section): PublicSection {
  return { ...s, quiz: s.quiz.map(publicQuestion) };
}

// Same cache key as worker/explain.py: sha1(section|question|misconception|language)[:12].
export function explainDir(lectureId: string, sectionId: string, questionId: string, misconception: string, language: string) {
  const key = [sectionId, questionId, misconception.trim().slice(0, 500), language].join("|");
  const hash = createHash("sha1").update(key).digest("hex").slice(0, 12);
  return path.join(CONTENT_DIR, lectureId, sectionId, "explain", hash);
}

export async function readExplain(dir: string): Promise<Explain | null> {
  try {
    return JSON.parse(await readFile(path.join(dir, "explain.json"), "utf8"));
  } catch {
    return null;
  }
}

/** A pre-generated explanation for this question + language, if any (demo / offline path). */
export async function findCachedExplain(lectureId: string, sectionId: string, questionId: string, language: string) {
  if (![lectureId, sectionId, questionId].every(isId)) return null;
  const root = path.join(CONTENT_DIR, lectureId, sectionId, "explain");
  let dirs: string[] = [];
  try {
    dirs = await readdir(root);
  } catch {
    return null;
  }
  for (const d of dirs) {
    if (!/^[0-9a-f]{12}$/.test(d)) continue;
    const e = await readExplain(path.join(root, d));
    if (e && e.question_id === questionId && e.language === language) return e;
  }
  return null;
}
