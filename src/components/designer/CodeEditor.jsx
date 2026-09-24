import React, { useState } from "react";
import { Check, RotateCcw } from "lucide-react";

// The designer's Code tab: edit the page's HTML by hand. Applying adds the edit to the chat
// as a new version (so "Restore this version" undoes it and the AI builds on it next).
// Publishing still runs the same safety check as AI-made pages.
export default function CodeEditor({ html, onApply, disabled }) {
  // `base` is the version the draft started from. A new version from the AI (or a restore)
  // replaces the text, unless you're mid-edit; then your edit is kept.
  const [base, setBase] = useState(html);
  const [draft, setDraft] = useState(html);
  const [err, setErr] = useState("");
  if (html !== base) {
    setBase(html);
    if (draft === base) setDraft(html);
  }
  const dirty = draft !== base;

  const apply = () => {
    const next = draft.trim();
    if (!/<[a-z!][\s\S]*>/i.test(next)) {
      setErr("That doesn't look like a web page. It needs HTML tags like <h1> or <p>.");
      return;
    }
    setErr("");
    setDraft(next);
    onApply(next);
  };

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if (dirty && !disabled) apply();
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: t } = el;
      setDraft((d) => d.slice(0, s) + "  " + d.slice(t));
      requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2));
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        aria-label="Page code"
        placeholder={"Ask the AI to build a site first, or paste a web page's HTML here.\n\n<!DOCTYPE html>\n<html>…</html>"}
        className="flex-1 min-h-0 w-full resize-none bg-slate-950 text-slate-200 placeholder:text-slate-600 font-mono text-xs leading-5 p-3 outline-none"
      />
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-t border-slate-700/50 bg-slate-900/60">
        <p className="flex-1 min-w-[12rem] text-[11px] text-slate-500">
          {err ? (
            <span className="text-amber-300">{err}</span>
          ) : (
            <>Edit the page by hand. Pictures you attached show as <code className="text-slate-400">bhimg:</code> codes; leave those as they are.</>
          )}
        </p>
        {dirty && (
          <button
            onClick={() => {
              setDraft(base);
              setErr("");
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Discard
          </button>
        )}
        <button
          onClick={apply}
          disabled={!dirty || disabled}
          title="Apply (Ctrl+S)"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 disabled:opacity-40 disabled:hover:bg-sky-500"
        >
          <Check className="w-3.5 h-3.5" /> Apply changes
        </button>
      </div>
    </div>
  );
}
