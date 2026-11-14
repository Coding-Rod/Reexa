import { connection } from "next/server";
import { readSection, toPublic } from "@/lib/content";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ lectureId: string; sectionId: string }> },
) {
  await connection();
  const { lectureId, sectionId } = await ctx.params;
  const section = await readSection(lectureId, sectionId);
  if (!section) return Response.json({ error: "Section not found" }, { status: 404 });
  // Answers and explanations are stripped: they are only revealed by /api/diagnose after an attempt.
  return Response.json(toPublic(section), { headers: { "Cache-Control": "no-store" } });
}
