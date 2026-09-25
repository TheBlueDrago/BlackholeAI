import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Inbox, Loader2, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { askConfirm } from "@/lib/dialogs";
import { messagesCsv } from "@/lib/messagesCsv";

// What visitors sent through the forms on one of your published sites (bookings, RSVPs,
// sign-ups): cloudflare-lib/inbox.js. Only the site's owner (or an admin) can read them.
export default function SiteMessages({ site, onClose }) {
  const [messages, setMessages] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  const call = async (body, tag) => {
    setBusy(tag);
    setErr("");
    try {
      const r = await base44.functions.invoke("site-form", { site, ...body });
      setMessages(r.data?.messages || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Couldn't load messages. Please try again.");
      setMessages((m) => m || []);
    } finally {
      setBusy("");
    }
  };

  useEffect(() => {
    call({ action: "list" }, "load");
    try {
      localStorage.setItem(`bh-inbox-seen:${site}`, new Date().toISOString());
    } catch {}
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  const clearAll = async () => {
    if (!(await askConfirm(`Delete all ${messages.length} messages for ${site}? This can't be undone.`, { confirmLabel: "Delete all", danger: true }))) return;
    call({ action: "clear" }, "clear");
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={`Messages for ${site}`} className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700/60">
          <Inbox className="w-5 h-5 text-sky-300" />
          <p className="flex-1 min-w-0 font-semibold text-white truncate">Messages · {site}</p>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages === null ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-300">No messages yet.</p>
              <p className="mt-2 text-sm text-slate-500">
                When visitors fill in a form on your site (a booking, an RSVP, a sign-up), what they send shows up here. Passwords and card numbers are never sent.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-500">{new Date(m.at).toLocaleString()}</p>
                  <button
                    onClick={() => call({ action: "delete", id: m.id }, m.id)}
                    disabled={!!busy}
                    aria-label="Delete this message"
                    className="p-1 rounded-md text-slate-500 hover:text-red-300 hover:bg-slate-700 disabled:opacity-40"
                  >
                    {busy === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <dl className="mt-1 space-y-1">
                  {m.fields.map(([label, value], i) => (
                    <div key={i} className="text-sm">
                      <dt className="inline text-slate-400">{label}: </dt>
                      <dd className="inline text-slate-100 break-words whitespace-pre-wrap">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))
          )}
          {err && <p className="text-sm text-red-400">{err}</p>}
        </div>
        {messages && messages.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-3">
              The latest 200 are kept.
              <button
                onClick={() => {
                  const blob = new Blob([String.fromCharCode(0xfeff) + messagesCsv(messages)], { type: "text/csv;charset=utf-8" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `${site}-messages.csv`;
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
                }}
                className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200"
              >
                <Download className="w-3.5 h-3.5" /> Download spreadsheet
              </button>
            </span>
            <button onClick={clearAll} disabled={!!busy} className="text-red-300 hover:text-red-200 disabled:opacity-40">
              Delete all
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
