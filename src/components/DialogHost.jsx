import React, { useEffect, useRef, useState } from "react";
import { answer, onDialog } from "@/lib/dialogs";

// Shows the dialogs asked for with askConfirm / askText / showNotice (lib/dialogs.js).
// Enter answers yes (or sends the text), Escape and tapping outside answer no.
export default function DialogHost() {
  const [d, setD] = useState(null);
  const [text, setText] = useState("");
  const okRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => onDialog(setD), []);

  useEffect(() => {
    if (!d) return undefined;
    setText(d.defaultValue || "");
    const focus = setTimeout(() => (d.type === "text" ? inputRef.current : okRef.current)?.focus(), 0);
    const cancel = d.type === "confirm" ? false : d.type === "text" ? null : undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        answer(cancel);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(focus);
      window.removeEventListener("keydown", onKey);
    };
  }, [d]);

  if (!d) return null;
  const cancel = () => answer(d.type === "confirm" ? false : d.type === "text" ? null : undefined);
  const ok = () => answer(d.type === "confirm" ? true : d.type === "text" ? text : undefined);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60"
      onMouseDown={(e) => e.target === e.currentTarget && cancel()}
    >
      <form
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="bh-dialog-message"
        onSubmit={(e) => {
          e.preventDefault();
          ok();
        }}
        className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5"
      >
        <p id="bh-dialog-message" className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {d.message}
        </p>
        {d.type === "text" && (
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={d.placeholder}
            maxLength={d.maxLength}
            className="mt-3 w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-500"
          />
        )}
        <div className="mt-5 flex justify-end gap-2">
          {d.type !== "notice" && (
            <button type="button" onClick={cancel} className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800">
              {d.cancelLabel}
            </button>
          )}
          <button
            ref={okRef}
            type="submit"
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-[#fff] ${d.danger ? "bg-red-600 hover:bg-red-500" : "bg-indigo-600 hover:bg-indigo-500"}`}
          >
            {d.confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
