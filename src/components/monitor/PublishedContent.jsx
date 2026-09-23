import React, { useEffect, useState } from "react";
import { Loader2, Globe, Gamepad2, Sparkles, EyeOff, Eye, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

const FLAGS = {
  red: { dot: "bg-red-500", chip: "bg-red-600/25 text-red-200 border-red-500/50", label: "Red flag" },
  yellow: { dot: "bg-amber-400", chip: "bg-amber-500/20 text-amber-200 border-amber-400/50", label: "Yellow flag" },
  green: { dot: "bg-emerald-500", chip: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40", label: "Green flag" },
};

const urlOf = (it) => (it.kind === "site" ? `https://${it.name}.blackhole-ai-tech.com` : `/chat/game/${encodeURIComponent(it.name)}`);

// Monitor → every published site and game with who made it and a safety flag:
// red (inappropriate, copyright clone, phishing, 50%+ malware) first, then yellow
// (might be harmful), then green (looks safe). Flags come from functions/admin-content.js.
export default function PublishedContent() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [open, setOpen] = useState(true);
  const [showGreen, setShowGreen] = useState(false);

  const load = async () => {
    setError("");
    try {
      const r = await base44.functions.invoke("admin-content", { action: "list" });
      setItems(r.data?.items || []);
    } catch (e) {
      setError(e?.response?.data?.error || "Could not load published sites and games.");
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const aiCheck = async (it) => {
    setBusy(`ai:${it.kind}:${it.name}`);
    setError("");
    try {
      const r = await base44.functions.invoke("admin-content", { action: "ai-check", kind: it.kind, name: it.name });
      const next = r.data?.item;
      if (next) setItems((list) => list.map((x) => (x.kind === it.kind && x.name === it.name ? next : x)));
    } catch (e) {
      setError(e?.response?.data?.error || "The AI check failed.");
    } finally {
      setBusy("");
    }
  };

  const takeDown = async (it, hide) => {
    if (hide && !window.confirm(`Take down "${it.title}"? Visitors will see that it was removed.`)) return;
    setBusy(`td:${it.kind}:${it.name}`);
    try {
      await base44.functions.invoke("admin-reports", { action: hide ? "hide" : "unhide", kind: it.kind, name: it.name.toLowerCase() });
      setItems((list) => list.map((x) => (x.kind === it.kind && x.name === it.name ? { ...x, takenDown: hide } : x)));
    } catch (e) {
      setError(e?.response?.data?.error || "Could not change that page.");
    } finally {
      setBusy("");
    }
  };

  // Pages published before names were limited to first names show the maker's email to anyone.
  const emailsShown = (items || []).filter((it) => it.emailShown).length;
  const hideEmails = async () => {
    setBusy("emails");
    setError("");
    try {
      await base44.functions.invoke("admin-content", { action: "hide-emails" });
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || "Could not hide the emails.");
    } finally {
      setBusy("");
    }
  };

  const counts = { red: 0, yellow: 0, green: 0 };
  for (const it of items || []) counts[it.flag] += 1;
  const shown = (items || []).filter((it) => showGreen || it.flag !== "green");

  return (
    <div className="w-full max-w-3xl mt-6 bg-slate-900/70 border border-slate-700/50 rounded-2xl p-4">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2">
        <span className="text-white font-semibold text-sm">Published sites & games</span>
        <span className="flex items-center gap-2 text-xs">
          {items && (
            <>
              <span className="text-red-300">🔴 {counts.red}</span>
              <span className="text-amber-200">🟡 {counts.yellow}</span>
              <span className="text-emerald-300">🟢 {counts.green}</span>
            </>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </span>
      </button>

      {open && (
        <div className="mt-3">
          <p className="text-[11px] text-slate-500 mb-2">
            🔴 inappropriate for kids, copyright copy, phishing or 50%+ malware · 🟡 might be harmful · 🟢 looks safe.
            Automatic check — use "AI check" for a closer look.
          </p>
          {emailsShown > 0 && (
            <div className="mb-3 rounded-xl border border-amber-400/40 bg-amber-950/20 p-3 flex flex-wrap items-center gap-2">
              <p className="flex-1 min-w-[12rem] text-xs text-amber-100">
                {emailsShown} published page{emailsShown === 1 ? " shows its maker's" : "s show their makers'"} email address to anyone who looks.
              </p>
              <button
                onClick={hideEmails}
                disabled={busy === "emails"}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-400 disabled:opacity-60"
              >
                {busy === "emails" ? "Hiding…" : "Hide emails"}
              </button>
            </div>
          )}
          {!items && (
            <div className="flex justify-center py-6 text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
          )}
          {items && items.length === 0 && !error && <p className="text-slate-500 text-sm">Nothing published yet.</p>}
          <div className="space-y-2">
            {shown.map((it) => {
              const f = FLAGS[it.flag];
              const key = `${it.kind}:${it.name}`;
              return (
                <div key={key} className={`rounded-xl border p-3 ${it.flag === "red" ? "border-red-500/40 bg-red-950/20" : it.flag === "yellow" ? "border-amber-400/30 bg-amber-950/10" : "border-slate-700/50 bg-slate-800/40"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium flex items-center gap-1.5 truncate">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${f.dot}`} />
                        {it.kind === "site" ? <Globe className="w-3.5 h-3.5 text-sky-300 shrink-0" /> : <Gamepad2 className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />}
                        <span className="truncate">{it.title}</span>
                        {it.takenDown && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600/40 text-red-100 shrink-0">taken down</span>}
                        {it.hidden && !it.takenDown && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 shrink-0">hidden</span>}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {it.kind === "site" ? `${it.name}.blackhole-ai-tech.com` : `game: ${it.name}`} · by {it.ownerName || "(no name)"} · {it.ownerEmail || "unknown email"}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${f.chip}`}>{f.label}</span>
                  </div>
                  {(it.reasons.length > 0 || it.ai) && (
                    <ul className="mt-1.5 text-[11px] text-slate-300 space-y-0.5">
                      {it.reasons.slice(0, 4).map((r) => (
                        <li key={r}>• {r}</li>
                      ))}
                      {it.ai && (
                        <li className="text-indigo-200">
                          ✦ AI check: {it.ai.flag}
                          {it.ai.reasons.length ? ` — ${it.ai.reasons.join("; ")}` : " — looks fine"}
                        </li>
                      )}
                    </ul>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <button
                      onClick={() => aiCheck(it)}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/80 text-white text-[11px] hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {busy === `ai:${key}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI check
                    </button>
                    <a
                      href={urlOf(it)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700 text-slate-100 text-[11px] hover:bg-slate-600"
                    >
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                    <button
                      onClick={() => takeDown(it, !it.takenDown)}
                      disabled={!!busy}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] disabled:opacity-50 ${it.takenDown ? "bg-emerald-600/80 text-white hover:bg-emerald-500" : "bg-red-600/80 text-white hover:bg-red-500"}`}
                    >
                      {busy === `td:${key}` ? <Loader2 className="w-3 h-3 animate-spin" /> : it.takenDown ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {it.takenDown ? "Put back" : "Take down"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {counts.green > 0 && (
            <button onClick={() => setShowGreen((s) => !s)} className="mt-2 text-xs text-slate-400 hover:text-slate-200 underline">
              {showGreen ? "Hide green (safe) pages" : `Show ${counts.green} green (safe) page${counts.green === 1 ? "" : "s"}`}
            </button>
          )}
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}
