import React, { useEffect, useRef, useState } from "react";
import { Flag, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import useEscape from "@/hooks/useEscape";
import { REPLY_REASONS, replyReportMessage } from "@/lib/replyReport";

// Flag button for an AI reply, and the small form it opens. Renders inside the reply's
// actions row (flex-wrap): the form takes a line of its own below the buttons.
export default function ReportReply({ question, reply }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("harmful");
  const [note, setNote] = useState("");
  const [state, setState] = useState(""); // "" | "sending" | "sent"
  const [error, setError] = useState("");
  const flagRef = useRef(null);
  const firstRef = useRef(null);

  const close = () => {
    setOpen(false);
    setError("");
    flagRef.current?.focus();
  };
  useEscape(open, close);
  useEffect(() => {
    if (open) firstRef.current?.focus();
  }, [open]);

  const send = async () => {
    setState("sending");
    setError("");
    try {
      const r = await base44.functions.invoke("contact", { action: "send", topic: "ai", message: replyReportMessage(reason, note, question, reply) });
      if (r?.data?.error) throw new Error(r.data.error);
      setState("sent");
      setOpen(false);
    } catch (e) {
      setState("");
      setError(e?.response?.data?.error || e?.message || "Couldn't send the report. Please try again.");
    }
  };

  if (state === "sent") {
    return (
      <span className="inline-flex items-center gap-1 p-1 text-[11px] text-slate-400" role="status">
        <Check className="w-3.5 h-3.5" /> Reported. Thank you
      </span>
    );
  }
  return (
    <>
      <button
        ref={flagRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        title="Report this reply"
        aria-label="Report this reply"
        aria-expanded={open}
        className={`p-1 rounded-md hover:text-slate-200 ${open ? "text-slate-200" : "text-slate-500"}`}
      >
        <Flag className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="basis-full mt-2 p-3 rounded-xl bg-slate-900/70 border border-slate-700/60 text-left">
          <fieldset>
            <legend className="text-xs font-medium text-slate-200 mb-1.5">What's wrong with this reply?</legend>
            {REPLY_REASONS.map(([k, label], i) => (
              <label key={k} className="flex items-center gap-2 py-1 text-xs text-slate-300 cursor-pointer">
                <input ref={i === 0 ? firstRef : undefined} type="radio" name="reply-report-reason" value={k} checked={reason === k} onChange={() => setReason(k)} className="accent-indigo-500" />
                {label}
              </label>
            ))}
          </fieldset>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Anything to add? (optional)"
            aria-label="Anything to add? (optional)"
            className="mt-2 w-full resize-none rounded-lg bg-slate-800 border border-slate-700/60 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500/60"
          />
          <p className="mt-1.5 text-[11px] text-slate-400">This sends the reply and your question before it to the Blackhole AI team.</p>
          {error && <p className="mt-1.5 text-[11px] text-red-400" role="alert">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={close} className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800">
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              disabled={state === "sending"}
              className="inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-[#fff] hover:bg-indigo-500 disabled:opacity-60"
            >
              {state === "sending" && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Send report
            </button>
          </div>
        </div>
      )}
    </>
  );
}
