import { spawn } from "node:child_process";
import { explainDir, findCachedExplain, readExplain, REPO_ROOT } from "@/lib/content";
import { unseal } from "@/lib/llm";

type Sealed = { lectureId: string; sectionId: string; questionId: string; misconception: string; language: string; iat: number };

const MAX_AGE_MS = 60 * 60 * 1000;
const RENDER_TIMEOUT_MS = 5 * 60 * 1000;
let running = 0; // ponytail: one render at a time per server; a queue if several students render at once

export async function POST(req: Request) {
  let token: unknown;
  try {
    ({ token } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const t = typeof token === "string" ? unseal<Sealed>(token) : null;
  if (!t || Date.now() - t.iat > MAX_AGE_MS) return Response.json({ error: "Invalid or expired request" }, { status: 400 });

  const dir = explainDir(t.lectureId, t.sectionId, t.questionId, t.misconception, t.language);
  const cached = await readExplain(dir);
  if (cached) return Response.json({ ...cached, cached: true });

  if (process.env.ALLOW_UPLOAD !== "1") {
    // No renderer online: serve the pre-generated video for this question's concept, if any.
    const near = await findCachedExplain(t.lectureId, t.sectionId, t.questionId, t.language);
    if (near) return Response.json({ ...near, cached: true });
    return Response.json({ error: "Live video generation runs in the local version only." }, { status: 503 });
  }
  if (running > 0) return Response.json({ error: "Another video is rendering. Try again in a minute." }, { status: 429 });

  running++;
  try {
    const code = await new Promise<number>((resolve) => {
      // argv array, no shell: the misconception text cannot become a command.
      const child = spawn(
        "conda",
        ["run", "--no-capture-output", "-n", "3b1b", "python", "-m", "worker.explain",
         "--lecture", t.lectureId, "--section", t.sectionId, "--question", t.questionId,
         "--misconception", t.misconception, "--language", t.language],
        { cwd: REPO_ROOT, stdio: "ignore", timeout: RENDER_TIMEOUT_MS },
      );
      child.on("close", (c) => resolve(c ?? 1));
      child.on("error", () => resolve(1));
    });
    const made = await readExplain(dir);
    if (code !== 0 || !made) return Response.json({ error: "Could not generate the video." }, { status: 500 });
    return Response.json({ ...made, cached: false });
  } finally {
    running--;
  }
}
