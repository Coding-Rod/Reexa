"use client";
// Per-student data lives only in this browser (privacy principle). Every access is guarded:
// storage can be blocked (private mode, previews) and the app must still work.

export type StudentNote = { id: string; t: number; text: string };
export type Progress = Record<string, { watched?: boolean; concepts?: Record<string, "gap" | "closed"> }>;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("tutor-store"));
  } catch {
    /* storage unavailable: keep working in memory */
  }
}

const notesKey = (sectionKey: string) => `tutor:notes:${sectionKey}`;
export const loadNotes = (sectionKey: string) => read<StudentNote[]>(notesKey(sectionKey), []);
export const saveNotes = (sectionKey: string, notes: StudentNote[]) => write(notesKey(sectionKey), notes);

export const loadProgress = () => read<Progress>("tutor:progress", {});
export function updateProgress(sectionKey: string, patch: (p: Progress[string]) => Progress[string]) {
  const all = loadProgress();
  all[sectionKey] = patch(all[sectionKey] ?? {});
  write("tutor:progress", all);
}

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// User preferences (language, styles, tutor instructions + their armor verdict). The name comes from sign-in.
export type LocalProfile = import("./profile").Profile & { name?: string };
export const loadProfile = () => read<LocalProfile | null>("tutor:profile", null);
export const saveProfile = (p: LocalProfile) => write("tutor:profile", p);

// Per-course settings, keyed by course slug.
export type CourseSettings = {
  title: string;
  exam_date: string | null;
  level: import("./profile").Level;
  language?: import("./profile").Language; // overrides the profile default
};
const courseKey = (slug: string) => `tutor:course:${slug}`;
export const loadCourse = (slug: string) => read<CourseSettings | null>(courseKey(slug), null);
export const saveCourse = (slug: string, c: CourseSettings) => write(courseKey(slug), c);
export function listCourses(): CourseSettings[] {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith("tutor:course:"))
      .map((k) => read<CourseSettings | null>(k, null))
      .filter((c): c is CourseSettings => !!c);
  } catch {
    return [];
  }
}

/** Removes everything Reexa keeps in this browser (notes, progress, profile, courses). */
export function clearLocalData() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("tutor:") && k !== "tutor:theme")
      .forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new Event("tutor-store"));
  } catch {
    /* nothing stored */
  }
}

/** Upload one PDF into a course. Sends ONE combined profile (course settings + user prefs); the server re-checks it. */
export async function uploadLecture(file: File, course: CourseSettings, profile: LocalProfile): Promise<{ ok: boolean; msg: string }> {
  const body = new FormData();
  body.append("file", file);
  const { styles, instructions } = profile;
  const language = course.language ?? profile.language;
  body.append("profile", JSON.stringify({ course: course.title, exam_date: course.exam_date, level: course.level, language, styles, instructions }));
  try {
    const res = await fetch("/api/upload", { method: "POST", body });
    const data = await res.json();
    return { ok: res.ok, msg: res.ok ? `${file.name}: generating lessons. The course page updates by itself.` : data.error };
  } catch {
    return { ok: false, msg: "Upload failed. Is the local server running?" };
  }
}

// "Continue" in the header: the last lesson this browser opened.
export const loadLastLesson = () => read<string | null>("tutor:last", null);
export const saveLastLesson = (sectionKey: string) => write("tutor:last", sectionKey);

export type Theme = "system" | "light" | "dark";
export const loadTheme = () => read<Theme>("tutor:theme", "system");
export function saveTheme(t: Theme) {
  write("tutor:theme", t);
  if (t === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

// In-progress form drafts (files can't be stored; only their names, to ask for re-attaching).
export const loadDraft = <T,>(form: string) => read<T | null>(`tutor:draft:${form}`, null);
export function saveDraft(form: string, value: unknown) {
  try {
    localStorage.setItem(`tutor:draft:${form}`, JSON.stringify(value)); // no store event: drafts aren't app state
    return true;
  } catch {
    return false;
  }
}
export function clearDraft(form: string) {
  try {
    localStorage.removeItem(`tutor:draft:${form}`);
  } catch {
    /* nothing stored */
  }
}
