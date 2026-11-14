import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Manifest, PublicSection, QuizItem, Section } from "./types";

export const CONTENT_DIR = path.join(process.cwd(), "public", "content");
export const REPO_ROOT = path.resolve(process.cwd(), "..");

// Trust boundary: ids come from the URL / request body and become file paths.
const ID = /^[A-Za-z0-9_-]{1,80}$/;
export const isId = (s: unknown): s is string => typeof s === "string" && ID.test(s);

const EMPTY: Manifest = { course: { id: "db2", title: "Databases 2" }, lectures: [] };

export async function readManifest(): Promise<Manifest> {
  try {
    return JSON.parse(await readFile(path.join(CONTENT_DIR, "manifest.json"), "utf8"));
  } catch {
    return EMPTY;
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
