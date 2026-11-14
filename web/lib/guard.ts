// Deterministic prompt-guard rules. Pure (no imports) so lib/armor.check.ts can run it directly.
// Filter names mirror Model Armor's where they overlap.
// ponytail: regex rules catch the obvious attacks only; Model Armor / the LLM classifier cover paraphrases.

const RULES: { filter: string; reason: string; re: RegExp }[] = [
  {
    filter: "pi_and_jailbreak",
    reason: "Tries to override the tutor's instructions.",
    re: /\b(ignore|disregard|forget|override|bypass)\b.{0,40}\b(instructions?|rules?|prompts?|guidelines|above|previous|prior|everything)\b|\b(system|developer|hidden)\s+(prompt|message|instructions?)\b|\byou\s+are\s+now\b|\bact\s+as\b|\bpretend\s+(to\s+be|you)\b|\bjailbreak\b|\bDAN\b|\bnew\s+instructions?\s*:|\brole\s*:\s*(system|assistant)\b/i,
  },
  {
    filter: "answer_leak",
    reason: "Asks the tutor to reveal answers.",
    re: /\b(reveal|show|print|give|tell|leak|dump|output|list)\b.{0,40}\b(answers?|solutions?|answer[\s_-]?key|correct\s+options?|answer_index)\b/i,
  },
  {
    filter: "malicious_uris",
    reason: "Links are not allowed in instructions.",
    re: /\bhttps?:\/\/|\bwww\.|\b[a-z0-9-]+\.(com|net|org|io|ru|xyz|info|top|ly|me|co|it)\b(\/|\s|$)/i,
  },
  {
    filter: "code_or_markup",
    reason: "Code or markup is not allowed in instructions.",
    re: /<\/?[a-z!][^>]*>|```|\{\{|\$\{|<\|[a-z_]+\|>/i,
  },
  {
    filter: "sdp",
    reason: "Contains personal contact data.",
    // 9+ digits = phone-like; dates (8 digits) pass.
    re: /[\w.+-]+@[\w-]+\.[\w.]+|(?:\d[\s().-]*){9,}/,
  },
];

export function localRules(text: string): { matched: string[]; reasons: string[] } {
  const hits = RULES.filter((r) => r.re.test(text));
  return { matched: hits.map((h) => h.filter), reasons: hits.map((h) => h.reason) };
}
