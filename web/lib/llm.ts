import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const LLM_MODEL = process.env.LLM_MODEL || "anthropic/claude-sonnet-5.5";
export const JURY_MODEL = process.env.JURY_MODEL || "openai/gpt-5.5";
export const llmEnabled = () => !!process.env.OPENROUTER_API_KEY && process.env.LLM_STUB !== "1";

type Msg = { role: "system" | "user"; content: string };

// OpenRouter is OpenAI-compatible: plain fetch, no SDK.
export async function chatJSON<T>(model: string, messages: Msg[]): Promise<T> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "AI on Campus Tutor",
    },
    body: JSON.stringify({ model, messages, response_format: { type: "json_object" }, temperature: 0.2 }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  // Some models wrap JSON in ``` fences despite response_format.
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(json) as T;
}

// Re-check questions are generated per request and served without their answer.
// The answer travels back with the client inside an AES-GCM token only the server can open.
const KEY = createHash("sha256")
  .update(process.env.RECHECK_SECRET || process.env.OPENROUTER_API_KEY || "dev-only-recheck-secret")
  .digest();

export function seal(obj: unknown): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", KEY, iv);
  const body = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString("base64url");
}

export function unseal<T>(token: string): T | null {
  try {
    const buf = Buffer.from(token, "base64url");
    const d = createDecipheriv("aes-256-gcm", KEY, buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8")) as T;
  } catch {
    return null;
  }
}
