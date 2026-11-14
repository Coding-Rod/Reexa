"use client";
import { useId, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useT } from "@/components/Lang";
import { fmtTime, loadNotes, saveNotes, type StudentNote } from "@/lib/store";
import type { Citation, Jury, Passage, PublicSection } from "@/lib/types";

export function JuryBadge({ jury }: { jury: Jury }) {
  const t = useT();
  const pass = jury.verdict === "pass";
  return (
    <span
      title={`${jury.model}: ${jury.reason}`}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        pass ? "border-good text-good" : "border-warn text-warn"
      }`}
    >
      <span aria-hidden>{pass ? "✓" : "!"}</span>
      {pass ? t.notes.verified : t.notes.flagged}
    </span>
  );
}

// Citation chip "02-Concurrency.pdf p.5" that opens the quoted passage (native popover, no library).
export function CitationChip({ c, passages }: { c: Pick<Citation, "file" | "page"> & { quote?: string }; passages?: Passage[] }) {
  const t = useT();
  const id = useId();
  const passage = passages?.find((p) => p.file === c.file && Number(p.page) === Number(c.page));
  return (
    <>
      <button
        popoverTarget={id}
        className="mx-0.5 inline-flex items-center rounded border border-border bg-background px-1.5 py-0 align-baseline font-mono text-[0.75rem] text-accent hover:border-accent"
      >
        {c.file} p.{c.page}
      </button>
      <div
        id={id}
        popover="auto"
        className="m-auto max-h-[70vh] w-[min(90vw,560px)] overflow-y-auto rounded-xl border border-border p-5 shadow-xl backdrop:bg-black/40"
      >
        <p className="mb-2 font-mono text-xs text-muted">
          {c.file} · {t.notes.page(Number(c.page))}
        </p>
        {c.quote && <blockquote className="mb-3 border-l-4 border-accent pl-3 italic">“{c.quote}”</blockquote>}
        {passage && (
          <details>
            <summary className="cursor-pointer text-sm text-muted">{t.notes.fullPage}</summary>
            <p className="mt-2 whitespace-pre-wrap text-sm">{passage.text}</p>
          </details>
        )}
        <button popoverTarget={id} popoverTargetAction="hide" className="mt-3 text-sm text-accent underline">
          {t.common.close}
        </button>
      </div>
    </>
  );
}

const CITE = /\[([^\[\]]+?\.pdf)\s+p\.?\s*(\d+)\]/gi;

export function AiNotes({ section }: { section: PublicSection }) {
  const t = useT();
  const md = section.notes_md.replace(CITE, (_m, file, page) => `[${file} p.${page}](#cite-${encodeURIComponent(file)}~${page})`);
  return (
    <div className="prose-notes text-[0.95rem] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children }) {
            if (href?.startsWith("#cite-")) {
              const [file, page] = href.slice(6).split("~");
              const f = decodeURIComponent(file);
              const quote = section.citations.find((c) => c.file === f && Number(c.page) === Number(page))?.quote;
              return <CitationChip c={{ file: f, page: Number(page), quote }} passages={section.passages} />;
            }
            return (
              <a href={href} className="text-accent underline" target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {md}
      </ReactMarkdown>
      <p className="mt-4 border-t border-border pt-3 text-xs text-muted">{t.notes.footer}</p>
    </div>
  );
}

export function MyNotes({ sectionKey, getTime, seek }: { sectionKey: string; getTime: () => number; seek: (t: number) => void }) {
  const t = useT();
  // Only rendered client-side after the lesson loads, so reading storage in the initializer is safe.
  const [notes, setNotes] = useState<StudentNote[]>(() => loadNotes(sectionKey));
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const commit = (next: StudentNote[]) => {
    const sorted = [...next].sort((a, b) => a.t - b.t);
    setNotes(sorted);
    saveNotes(sectionKey, sorted);
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          commit([...notes, { id: crypto.randomUUID(), t: getTime(), text: draft.trim() }]);
          setDraft("");
        }}
      >
        <label htmlFor="new-note" className="mb-1 block text-sm font-medium">
          {t.notes.newNote}
        </label>
        <textarea
          id="new-note"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          rows={3}
          placeholder={t.notes.placeholder}
          className="w-full rounded-lg border border-border bg-background p-2 text-sm"
        />
        <button type="submit" disabled={!draft.trim()} className="mt-2 rounded-lg bg-accent px-3 py-1.5 text-sm text-accent-fg disabled:opacity-40">
          {t.notes.add}
        </button>
      </form>

      <ol className="mt-4 space-y-2">
        {notes.length === 0 && <li className="text-sm text-muted">{t.notes.empty}</li>}
        {notes.map((n) => (
          <li key={n.id} className="rounded-lg border border-border bg-background p-2">
            <div className="flex items-center gap-2">
              <button onClick={() => seek(n.t)} className="font-mono text-xs text-accent underline" title={t.notes.jump}>
                {fmtTime(n.t)}
              </button>
              <span className="flex-1" />
              {editing !== n.id && (
                <button
                  onClick={() => {
                    setEditing(n.id);
                    setEditText(n.text);
                  }}
                  className="text-xs text-muted hover:text-foreground"
                >
                  {t.common.edit}
                </button>
              )}
              <button onClick={() => commit(notes.filter((x) => x.id !== n.id))} className="text-xs text-muted hover:text-bad" aria-label={t.notes.deleteAt(fmtTime(n.t))}>
                {t.common.delete}
              </button>
            </div>
            {editing === n.id ? (
              <div className="mt-1">
                <textarea
                  aria-label={t.notes.editNote}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="w-full rounded border border-border bg-surface p-1 text-sm"
                />
                <div className="mt-1 flex gap-2 text-xs">
                  <button
                    onClick={() => {
                      commit(notes.map((x) => (x.id === n.id ? { ...x, text: editText.trim() || x.text } : x)));
                      setEditing(null);
                    }}
                    className="text-accent underline"
                  >
                    {t.common.save}
                  </button>
                  <button onClick={() => setEditing(null)} className="text-muted underline">
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-sm">{n.text}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
