import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readManifest, REPO_ROOT, writeManifest } from "@/lib/content";

const MAX_BYTES = 50 * 1024 * 1024;

// Local only: rendering needs ManimGL + LaTeX on the machine, which Vercel functions don't have.
export async function POST(req: Request) {
  if (process.env.ALLOW_UPLOAD !== "1")
    return Response.json({ error: "Upload works in the local version only." }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "File too large (max 50 MB)" }, { status: 413 });

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

  const m = await readManifest();
  const entry = { id, title: base.replace(/\.pdf$/i, "").replace(/[_-]+/g, " "), source: base, status: "processing" as const, sections: [] };
  m.lectures = [...m.lectures.filter((l) => l.id !== id), entry];
  await writeManifest(m);

  const child = spawn("conda", ["run", "--no-capture-output", "-n", "3b1b", "python", "-m", "worker.pipeline", dest], {
    cwd: REPO_ROOT,
    detached: true,
    stdio: "ignore",
  });
  child.on("error", (e) => console.error("upload: failed to start worker", e));
  child.unref();

  return Response.json({ id, status: "processing" });
}
