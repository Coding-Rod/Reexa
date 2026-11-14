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

// Full profile incl. name stays here; only the name-less part is ever sent to the server.
export type LocalProfile = import("./profile").Profile & { name: string };
export const loadProfile = () => read<LocalProfile | null>("tutor:profile", null);
export const saveProfile = (p: LocalProfile) => write("tutor:profile", p);
