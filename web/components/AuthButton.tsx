"use client";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { LogIn, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { auth, authEnabled, google } from "@/lib/firebase";

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

  async function login() {
    setError("");
    try {
      await signInWithPopup(auth!, google);
    } catch (e) {
      if ((e as { code?: string }).code !== "auth/popup-closed-by-user") setError("Sign-in failed. Try again.");
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
    <div className="relative">
      <button type="button" onClick={login} className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg">
        <LogIn className="h-4 w-4" aria-hidden /> Sign in with Google
      </button>
      {error && (
        <p role="alert" className="absolute right-0 mt-1 whitespace-nowrap text-xs text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
