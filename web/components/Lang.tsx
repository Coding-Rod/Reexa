"use client";
import { LanguagesIcon } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { dicts, LANG_COOKIE, type Lang } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/profile";

const LangContext = createContext<Lang>("en");

export const LangProvider = ({ lang, children }: { lang: Lang; children: React.ReactNode }) => (
  <LangContext.Provider value={lang}>{children}</LangContext.Provider>
);

export const useLang = () => useContext(LangContext);
export const useT = () => dicts[useLang()];

/** Persist the interface language (cookie for the server render, localStorage for the profile) and reload.
 *  ponytail: full reload, not router.refresh(): the soft refresh kept stale client strings. */
export function useSetLang() {
  return (lang: Lang) => {
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
    try {
      localStorage.setItem("tutor:uiLang", lang);
    } catch {
      /* storage blocked: the cookie is enough */
    }
    window.location.reload();
  };
}

export function LangMenu() {
  const lang = useLang();
  const t = useT();
  const setLang = useSetLang();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${t.nav.language}: ${LANGUAGES[lang]}`}
        title={t.nav.language}
        className="flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-2 text-xs font-semibold uppercase text-muted hover:border-accent hover:text-accent"
      >
        <LanguagesIcon size={15} aria-hidden />
        {lang}
      </button>
      {open && (
        <ul role="menu" className="absolute right-0 z-50 mt-2 w-40 rounded-lg border border-border bg-surface p-1 shadow-lg">
          {(Object.keys(LANGUAGES) as Lang[]).map((code) => (
            <li key={code} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={code === lang}
                lang={code}
                onClick={() => {
                  setOpen(false);
                  if (code !== lang) setLang(code);
                }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-background ${code === lang ? "text-accent" : ""}`}
              >
                {LANGUAGES[code]}
                <span className="text-xs uppercase text-muted">{code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
