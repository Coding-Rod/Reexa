import { connection } from "next/server";
import { readManifest } from "@/lib/content";

// Read from disk on every request: the local worker rewrites the manifest while it runs.
export async function GET() {
  await connection();
  return Response.json(await readManifest(), { headers: { "Cache-Control": "no-store" } });
}
