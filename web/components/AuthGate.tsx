"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthButton";
import { useT } from "@/components/Lang";
import { authEnabled } from "@/lib/firebase";

const PUBLIC = ["/signin", "/download"];

/** Signed-out visitors go to /signin. Without Firebase config the app stays open (local/demo mode). */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const t = useT();
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const open = !authEnabled || PUBLIC.includes(pathname);

  useEffect(() => {
    if (!open && ready && !user) router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
  }, [open, ready, user, pathname, router]);

  if (open || user) return <>{children}</>;
  return (
    <main aria-busy="true" className="mx-auto w-full max-w-5xl animate-pulse px-4 py-10">
      <span className="sr-only">{t.signin.checking}</span>
      <div className="h-4 w-32 rounded bg-accent-soft" />
      <div className="mt-3 h-9 w-72 max-w-full rounded bg-accent-soft" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-44 rounded-xl border border-border bg-surface" />
        ))}
      </div>
    </main>
  );
}
