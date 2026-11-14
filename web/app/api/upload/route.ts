import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkProfile } from "@/lib/armor";
import { readManifest, REPO_ROOT, upsertCourse, writeManifest } from "@/lib/content";

const MAX_BYTES = 50 * 1024 * 1024;

// Local only: rendering needs ManimGL + LaTeX on the machine, which Vercel functions don't have.
export async function POST(req: Request) {
  if (process.env.ALLOW_UPLOAD !== "1")
    return Response.json({ error: "Upload works in the local version only." }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "File too large (max 50 MB)" }, { status: 413 });

  // Re-check the profile server-side: never trust the client's earlier armor verdict.
  let rawProfile: unknown = null;
  try {
    rawProfile = JSON.parse(String(form?.get("profile") ?? ""));
  } catch {
    /* handled below */
  }
  if (!rawProfile) return Response.json({ error: "Set up your profile first." }, { status: 400 });
  const { profile, errors } = await checkProfile(rawProfile);
  if (!profile) return Response.json({ error: errors[0] ?? "Set up your profile first." }, { status: 400 });
  if (profile.armor?.verdict !== "pass")
    return Response.json({ error: `Your instructions were blocked: ${profile.armor?.reason}` }, { status: 422 });

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!file.name.toLowerCase().endsWith(".pdf") || bytes.subarray(0, 5).toString() !== "%PDF-")
    return Response.json({ error: "Only PDF files are accepted" }, { status: 400 });

  // Never trust the client filename as a path.
  const base = path.basename(file.name).replace(/[^A-Za-z0-9._-]/g, "_");
  const id = base.replace(/\.pdf$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `lecture-${Date.now()}`;
  const inbox = path.join(REPO_ROOT, "worker", "inbox");
  await mkdir(inbox, { recursive: true });
  const dest = path.join(inbox, base);
  await writeFile(dest, bytes);
  // normalizeProfile builds a fresh object, so a client-sent name never reaches disk or the worker.
  const profilePath = path.join(inbox, `${base.replace(/\.pdf$/i, "")}.profile.json`);
  await writeFile(profilePath, JSON.stringify(profile, null, 2));

  const m = await readManifest();
  const course_id = upsertCourse(m, profile.course);
  const entry = { id, course_id, title: base.replace(/\.pdf$/i, "").replace(/[_-]+/g, " "), source: base, status: "processing" as const, language: profile.language, sections: [] };
  m.lectures = [...m.lectures.filter((l) => l.id !== id), entry];
  await writeManifest(m);

  const child = spawn("conda", ["run", "--no-capture-output", "-n", "3b1b", "python", "-m", "worker.pipeline", dest, "--profile", profilePath], {
    cwd: REPO_ROOT,
    detached: true,
    stdio: "ignore",
  });
  child.on("error", (e) => console.error("upload: failed to start worker", e));
  child.unref();

  return Response.json({ id, status: "processing" });
}
