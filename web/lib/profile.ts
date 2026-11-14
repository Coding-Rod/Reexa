// Learner profile contract: specs/001-misconception-video-tutor/contracts/profile.md
// Pure module (no server-only, no imports) so the form, the API and the check script share it.

export const LANGUAGES = {
  en: "English",
  it: "Italiano",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
} as const;
export const LANGUAGE_EN_NAMES: Record<Language, string> = {
  en: "English",
  it: "Italian",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
};
export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const STYLES = {
  visual: "Visual (diagrams, animations)",
  examples: "Worked examples",
  analogies: "Analogies",
  step_by_step: "Step by step",
  formal: "Formal definitions",
} as const;

export type Language = keyof typeof LANGUAGES;
export type Level = (typeof LEVELS)[number];
export type Style = keyof typeof STYLES;

export const LIMITS = { name: 60, course: 80, instructions: 500 } as const;

export type Armor = {
  engine: "model_armor" | "local";
  verdict: "pass" | "block";
  matched: string[];
  reason: string;
  checked_at: string;
};

// What leaves the browser: never the name.
export type Profile = {
  course: string;
  exam_date: string | null;
  level: Level;
  language: Language;
  styles: Style[];
  instructions: string;
  armor?: Armor;
};

export const isLanguage = (v: unknown): v is Language => typeof v === "string" && Object.hasOwn(LANGUAGES, v);

const clean = (v: unknown) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim() : "");

// Trust boundary: strict allowlists and length caps. Too-long text is an error, not silently cut,
// so the guard always sees exactly what the student wrote.
export function normalizeProfile(raw: unknown): { profile?: Profile; errors: string[] } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: string[] = [];

  const course = clean(r.course);
  if (!course) errors.push("Course is required.");
  if (course.length > LIMITS.course) errors.push(`Course must be at most ${LIMITS.course} characters.`);

  const instructions = clean(r.instructions);
  if (instructions.length > LIMITS.instructions) errors.push(`Instructions must be at most ${LIMITS.instructions} characters.`);

  let exam_date: string | null = null;
  if (r.exam_date) {
    const d = clean(r.exam_date);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`))) exam_date = d;
    else errors.push("Exam date must be YYYY-MM-DD.");
  }

  const level = LEVELS.find((l) => l === r.level);
  if (!level) errors.push("Choose a level.");

  const language = isLanguage(r.language) ? r.language : undefined;
  if (!language) errors.push("Choose a supported language.");

  const styles = Array.isArray(r.styles)
    ? [...new Set(r.styles.filter((s): s is Style => typeof s === "string" && Object.hasOwn(STYLES, s)))]
    : [];

  if (errors.length) return { errors };
  return { profile: { course, exam_date, level: level!, language: language!, styles, instructions }, errors };
}

/** URL/course id from a course title. Same rule as worker/pipeline.py course_for(). */
export const courseSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "course";
