import { checkProfile } from "@/lib/armor";

// Validate + guard the learner profile. The client sends no name (it stays in the browser).
export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const { profile, errors } = await checkProfile(raw);
  if (!profile) return Response.json({ ok: false, errors }, { status: 400 });
  const ok = profile.armor?.verdict === "pass";
  return Response.json({ ok, profile, armor: profile.armor }, { status: ok ? 200 : 422 });
}
