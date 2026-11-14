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
  return <p className="py-16 text-center text-muted">{t.signin.checking}</p>;
}
