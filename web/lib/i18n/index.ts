// UI dictionaries. Interface languages are a superset of lesson languages (lib/profile.ts LANGUAGES):
// tr and hi are interface-only until the video pipeline has voices and fonts for them.
import { LANGUAGES } from "@/lib/profile";
import de from "./de";
import en, { type Dict } from "./en";
import es from "./es";
import fr from "./fr";
import hi from "./hi";
import it from "./it";
import pt from "./pt";
import tr from "./tr";

export type { Dict };
export const UI_LANGUAGES = { ...LANGUAGES, tr: "Türkçe", hi: "हिन्दी" } as const;
export type Lang = keyof typeof UI_LANGUAGES;
export const isUiLang = (v: unknown): v is Lang => typeof v === "string" && Object.hasOwn(UI_LANGUAGES, v);
export const dicts: Record<Lang, Dict> = { en, it, es, fr, de, pt, tr, hi };
export const LANG_COOKIE = "lang";

/** Cookie value, else the first supported Accept-Language entry, else English. */
export function parseLang(cookie?: string, acceptLanguage?: string | null): Lang {
  if (isUiLang(cookie)) return cookie;
  for (const part of (acceptLanguage ?? "").split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isUiLang(code)) return code;
  }
  return "en";
}
