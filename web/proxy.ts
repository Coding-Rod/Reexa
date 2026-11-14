import { NextResponse, type NextRequest } from "next/server";

// Content JSON (quiz answers, explanations) is read from disk by API routes only.
// Media (mp4, vtt) stays public.
export function proxy(request: NextRequest) {
  let path = request.nextUrl.pathname;
  try {
    path = decodeURIComponent(path); // %2Ejson must not slip through
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
  if (/\.json\/*$/i.test(path)) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = { matcher: "/content/:path*" };
