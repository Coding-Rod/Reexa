"use client";
import { createContext, useContext } from "react";
import { dicts, LANG_COOKIE, type Lang } from "@/lib/i18n";

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
