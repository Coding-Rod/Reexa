"use client";
import {
  ChartNoAxesColumnIncreasingIcon,
  LibraryBigIcon,
  PlayIcon,
  SearchIcon,
  UserRoundIcon,
  DownloadIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import AuthButton from "@/components/AuthButton";
import { authEnabled } from "@/lib/firebase";
import { useT } from "@/components/Lang";
import { fmtTime, loadLastLesson } from "@/lib/store";
import type { Manifest } from "@/lib/types";


export default function AppHeader() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/manifest")
      .then((r) => r.json())
      .then(setManifest)
      .catch(() => {});
    const sync = () => setLast(loadLastLesson());
    sync();
    window.addEventListener("tutor-store", sync);
    return () => window.removeEventListener("tutor-store", sync);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setQuery("");
        setPalette(true);
      }
      if (e.key === "Escape") setPalette(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (palette) input.current?.focus();
  }, [palette]);

  const lessons = useMemo(
    () =>
      (manifest?.lectures ?? [])
        .filter((l) => l.status === "ready")
        .flatMap((l) => {
          const course = manifest?.courses.find((c) => c.id === l.course_id)?.title ?? "";
          return l.sections.map((s) => ({ key: `${l.id}/${s.id}`, title: s.title, lecture: course ? `${course} · ${l.title}` : l.title, duration: s.duration }));
        }),
    [manifest],
  );
  // Always rendered (no layout jump); disabled until there is a lesson to continue.
  const continueKey = last && lessons.some((l) => l.key === last) ? last : lessons[0]?.key;
  const continueHref = continueKey ? `/learn/${continueKey}` : null;
  const results = lessons.filter((l) => `${l.title} ${l.lecture}`.toLowerCase().includes(query.trim().toLowerCase()));

  const links = [
    { href: "/", label: t.nav.courses, icon: LibraryBigIcon, active: pathname === "/" || pathname.startsWith("/course/") },
    { href: continueHref, label: t.nav.continue, icon: PlayIcon, active: pathname.startsWith("/learn") },
    { href: "/dashboard", label: t.nav.progress, icon: ChartNoAxesColumnIncreasingIcon, active: pathname === "/dashboard" },
    // Signed in: Profile lives in the avatar menu. Without Firebase there is no avatar, so keep it here.
    ...(authEnabled ? [] : [{ href: "/profile", label: t.nav.profile, icon: UserRoundIcon, active: pathname === "/profile" }]),
    { href: "/download", label: t.nav.download, icon: DownloadIcon, active: pathname === "/download" },
  ];

  // Sign-in is a standalone screen: no navigation until the user is in.
  if (pathname === "/signin") return null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex h-[var(--header-h)] max-w-[1600px] items-center gap-2 px-3 sm:gap-4 sm:px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight" aria-label={t.nav.home}>
            <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-extrabold text-accent-fg">
              Re
            </span>
            <span className="hidden sm:inline">Reexa</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setQuery("");
              setPalette(true);
            }}
            className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm text-muted hover:border-accent sm:ml-4 sm:w-64 md:w-80"
            aria-label={t.nav.search}
          >
            <SearchIcon size={16} aria-hidden />
            <span className="hidden sm:inline">{t.nav.search}</span>
            <kbd className="ml-auto hidden rounded border border-border px-1.5 text-[11px] sm:inline">Ctrl K</kbd>
          </button>

          <nav aria-label={t.nav.main} className="flex h-full items-stretch sm:ml-auto">
            {links.map(({ href, label, icon: Icon, active }) => {
              const cls = "relative flex min-w-12 flex-col items-center justify-center gap-0.5 px-1.5 text-[11px] sm:min-w-16";
              if (!href)
                return (
                  <span key={label} aria-disabled="true" className={`${cls} cursor-not-allowed text-muted opacity-40`}>
                    <Icon size={19} aria-hidden />
                    <span>{label}</span>
                  </span>
                );
              return (
                <Link
                  key={href + label}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`${cls} ${active ? "text-accent" : "text-muted hover:text-accent"}`}
                >
                  <Icon size={19} aria-hidden />
                  <span>{label}</span>
                  {active && <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 rounded bg-accent" />}
                </Link>
              );
            })}
          </nav>

          {/* Language and theme live in the profile (Preferences), not in the bar. */}
          <AuthButton />
        </div>
      </header>

      {palette && (
        <div className="fixed inset-0 z-50 grid place-items-start justify-center px-4 pt-[12vh]">
          <button type="button" aria-label={t.nav.closeSearch} className="absolute inset-0 bg-black/50" onClick={() => setPalette(false)} />
          <div role="dialog" aria-modal="true" aria-label={t.nav.search} className="relative w-[min(640px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (results[0]) {
                  router.push(`/learn/${results[0].key}`);
                  setPalette(false);
                }
              }}
              className="flex items-center gap-3 border-b border-border px-4 py-3"
            >
              <SearchIcon size={18} className="text-muted" aria-hidden />
              <input
                ref={input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.nav.searchPlaceholder}
                aria-label={t.nav.lessonTitle}
                className="min-w-0 flex-1 bg-transparent text-base outline-none"
              />
              <kbd className="rounded border border-border px-1.5 text-[11px] text-muted">Esc</kbd>
            </form>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-4 text-sm text-muted">{t.nav.noMatch(query)}</li>}
              {results.map((r) => (
                <li key={r.key}>
                  <Link
                    href={`/learn/${r.key}`}
                    onClick={() => setPalette(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent-soft focus-visible:bg-accent-soft"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{r.title}</span>
                      <span className="block truncate text-xs text-muted">{r.lecture}</span>
                    </span>
                    <span className="font-mono text-xs text-muted">{fmtTime(r.duration)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
