"use client";
import { BotIcon, SendIcon, XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLang, useT } from "@/components/Lang";
import { CitationChip } from "@/components/Notes";
import type { Citation, Passage } from "@/lib/types";

type Turn = { role: "user" | "assistant"; content: string; citations?: Citation[]; passages?: Passage[] };

/** Floating course tutor: answers only from the course pages, with citations. Scope follows the page you are on. */
export default function TutorFab() {
  const t = useT();
  const lang = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  const [, area, a, b] = pathname.split("/");
  const scope = area === "learn" ? { lectureId: a, sectionId: b } : area === "course" ? { courseId: a } : {};
  const scopeLabel = area === "learn" ? t.tutor.scopeLesson : area === "course" ? t.tutor.scopeCourse : t.tutor.scopeAll;

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);
  useEffect(() => {
    if (open) input.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  if (pathname === "/signin") return null;

  async function ask(e?: React.FormEvent) {
    e?.preventDefault();
    const q = draft.trim();
    if (!q || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: q }];
    setTurns(next);
    setDraft("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...scope, language: lang, messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTurns([...next, { role: "assistant", content: data.notCovered ? t.tutor.notCovered : data.answer, citations: data.citations, passages: data.passages }]);
    } catch {
      setTurns([...next, { role: "assistant", content: t.tutor.error }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-label={t.tutor.title}
          className="fixed bottom-24 right-4 z-50 flex max-h-[min(70vh,600px)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        >
          <header className="flex items-center gap-2 border-b border-border px-4 py-3">
            <BotIcon size={18} className="text-accent" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">{t.tutor.title}</h2>
              <p className="truncate text-xs text-muted">{scopeLabel}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t.tutor.close} className="rounded-md p-1 text-muted hover:text-foreground">
              <XIcon size={18} aria-hidden />
            </button>
          </header>
          <ol ref={list} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {turns.length === 0 && <li className="text-muted">{t.tutor.intro}</li>}
            {turns.map((m, i) => (
              <li key={i} className={m.role === "user" ? "ml-8 rounded-xl bg-accent-soft px-3 py-2" : "mr-4"}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                {!!m.citations?.length && (
                  <p className="mt-1 text-xs text-muted">
                    {t.common.sources}{" "}
                    {m.citations.map((c, j) => (
                      <CitationChip key={j} c={c} passages={m.passages} />
                    ))}
                  </p>
                )}
              </li>
            ))}
            {busy && <li className="text-muted">{t.tutor.thinking}</li>}
          </ol>
          <form onSubmit={ask} className="flex items-end gap-2 border-t border-border p-3">
            <label htmlFor="tutor-q" className="sr-only">
              {t.tutor.placeholder}
            </label>
            <textarea
              id="tutor-q"
              ref={input}
              rows={2}
              maxLength={1000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask();
                }
              }}
              placeholder={t.tutor.placeholder}
              className="min-w-0 flex-1 resize-none rounded-lg border border-border bg-background p-2 text-sm"
            />
            <button type="submit" disabled={!draft.trim() || busy} aria-label={t.tutor.send} className="grid size-10 place-items-center rounded-lg bg-accent text-accent-fg disabled:opacity-40">
              <SendIcon size={16} aria-hidden />
            </button>
          </form>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? t.tutor.close : t.tutor.open}
        title={t.tutor.open}
        className="fixed bottom-6 right-4 z-50 grid size-14 place-items-center rounded-full bg-accent text-accent-fg shadow-lg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {open ? <XIcon size={24} aria-hidden /> : <BotIcon size={24} aria-hidden />}
      </button>
    </>
  );
}
