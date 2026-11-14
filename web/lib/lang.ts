import "server-only";
import { cookies, headers } from "next/headers";
import { dicts, LANG_COOKIE, parseLang } from "@/lib/i18n";

/** UI language for server components: the `lang` cookie, else the browser's Accept-Language. */
export async function getLang() {
  return parseLang((await cookies()).get(LANG_COOKIE)?.value, (await headers()).get("accept-language"));
}
export const getT = async () => dicts[await getLang()];
