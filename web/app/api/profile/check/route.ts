import { checkProfile } from "@/lib/armor";

// Validate + guard the user's preferences (course is optional here; uploads require it).
export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const { profile, errors } = await checkProfile(raw, { requireCourse: false });
  if (!profile) return Response.json({ ok: false, errors }, { status: 400 });
  const ok = profile.armor?.verdict === "pass";
  return Response.json({ ok, profile, armor: profile.armor }, { status: ok ? 200 : 422 });
}
