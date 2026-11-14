// UI dictionaries. Interface languages = lesson languages (native names in lib/profile.ts LANGUAGES).
import { isLanguage, type Language } from "@/lib/profile";
import de from "./de";
import en, { type Dict } from "./en";
import es from "./es";
import fr from "./fr";
import it from "./it";
import pt from "./pt";

export type { Dict };
export type Lang = Language;
export const dicts: Record<Lang, Dict> = { en, it, es, fr, de, pt };
export const LANG_COOKIE = "lang";

/** Cookie value, else the first supported Accept-Language entry, else English. */
export function parseLang(cookie?: string, acceptLanguage?: string | null): Lang {
  if (isLanguage(cookie)) return cookie;
  for (const part of (acceptLanguage ?? "").split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isLanguage(code)) return code;
  }
  return "en";
}
