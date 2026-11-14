"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import AuthButton, { useAuth } from "@/components/AuthButton";
import { useT } from "@/components/Lang";
import { authEnabled } from "@/lib/firebase";

function SignIn() {
  const t = useT();
  const { user } = useAuth();
  const router = useRouter();
  // After sign-in the student always lands on Courses.
  useEffect(() => {
    if (user || !authEnabled) router.replace("/");
  }, [user, router]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <span aria-hidden className="grid size-14 place-items-center rounded-2xl bg-accent text-xl font-extrabold text-accent-fg">
        Re
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">{t.signin.title}</h1>
      <p className="mt-3 text-muted">{t.signin.subtitle}</p>
      <div className="mt-8">{authEnabled ? <AuthButton /> : <Link href="/" className="text-accent underline">{t.nav.courses}</Link>}</div>
      <p className="mt-6 text-xs text-muted">{t.signin.privacy}</p>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}
