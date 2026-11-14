"use client";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { LogIn, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { auth, authEnabled, providers } from "@/lib/firebase";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => (auth ? onAuthStateChanged(auth, setUser) : undefined), []);
  return user;
}

export default function AuthButton() {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!authEnabled || !auth) return null;

  async function login(p: keyof typeof providers) {
    setError("");
    try {
      await signInWithPopup(auth!, providers[p]);
      setOpen(false);
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (code !== "auth/popup-closed-by-user") setError(code === "auth/account-exists-with-different-credential" ? "This email already uses the other sign-in method." : "Sign-in failed. Try again.");
    }
  }

  if (user)
    return (
      <div ref={box} className="relative">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-2 rounded-full border border-border px-2 py-1 text-sm">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote avatar, tiny, no optimizer needed */}
          {user.photoURL ? <img src={user.photoURL} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" /> : null}
          <span className="hidden max-w-32 truncate sm:inline">{user.displayName ?? user.email}</span>
        </button>
        {open && (
          <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-border bg-surface p-1 shadow-lg">
            <button type="button" onClick={() => signOut(auth!)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-background">
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </div>
        )}
      </div>
    );

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg">
        <LogIn className="h-4 w-4" aria-hidden /> Sign in
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 space-y-1 rounded-lg border border-border bg-surface p-2 shadow-lg">
          <button type="button" onClick={() => login("google")} className="w-full rounded-md border border-border px-3 py-2 text-sm hover:bg-background">Continue with Google</button>
          <button type="button" onClick={() => login("github")} className="w-full rounded-md border border-border px-3 py-2 text-sm hover:bg-background">Continue with GitHub</button>
          {error && <p role="alert" className="px-1 text-xs text-bad">{error}</p>}
        </div>
      )}
    </div>
  );
}
