import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Flag, Loader2, CheckCircle2 } from "lucide-react";
import Honeypot from "@/components/Honeypot";
import { base44 } from "@/api/base44Client";
import usePageTitle from "@/hooks/usePageTitle";

// Keys must match REASONS in cloudflare-lib/reports.js.
const REASONS = [
  ["phishing", "Phishing or stealing passwords"],
  ["scam", "Scam or fake store"],
  ["malware", "Malware or harmful downloads"],
  ["adult", "Adult or violent content"],
  ["hate", "Hate or harassment"],
  ["bullying", "Bullying someone or sharing their private info"],
  ["copyright", "Copyright or impersonation"],
  ["other", "Something else"],
];

// Opened from the "Report" link on every published site/game (added by
// functions/published/[kind]/[name].js) and the flag buttons in the app. Public on
// purpose: most visitors of a published site have no Blackhole account.
export default function Report() {
  usePageTitle("Report a page");
  const [params] = useSearchParams();
  const [kind, setKind] = useState(params.get("kind") === "game" ? "game" : "site");
  const [name, setName] = useState((params.get("name") || "").toLowerCase());
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const address = kind === "site" ? `${name || "name"}.blackhole-ai-tech.com` : `the game "${name}"`;

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError(`Which ${kind} are you reporting?`);
    if (!reason) return setError("Pick a reason.");
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("report-site", { kind, name: name.trim(), reason, details, website });
      if (res.data?.error) setError(res.data.error);
      else setSent(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not send the report. Try again in a minute.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6">
        {sent ? (
          <div className="text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h1 className="text-xl font-semibold text-white">Thanks — report sent</h1>
            <p className="text-sm text-slate-400">
              We'll look at {address}. Pages that break the rules are taken down.
            </p>
            <p className="text-sm text-slate-400">
              If you're worried about someone's safety right now, tell a parent, teacher or another adult you trust.
            </p>
            <a href="/" className="inline-block text-sm text-indigo-300 underline">Go to Blackhole AI</a>
          </div>
        ) : (
          <form onSubmit={submit} className="relative space-y-4">
            <Honeypot value={website} onChange={setWebsite} />
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-400" />
              <h1 className="text-xl font-semibold text-white">Report a {kind}</h1>
            </div>
            {params.get("name") ? (
              <p className="text-sm text-slate-400">You're reporting <span className="text-slate-200 [overflow-wrap:anywhere]">{address}</span>.</p>
            ) : (
              <>
              <div className="flex gap-2 text-sm" role="radiogroup" aria-label="Site or game">
                {["site", "game"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={kind === k}
                    onClick={() => setKind(k)}
                    className={`flex-1 py-1.5 rounded-lg border capitalize ${kind === k ? "border-red-400 text-white bg-red-500/10" : "border-slate-700 text-slate-400"}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <label className="block text-sm">
                <span className="text-slate-400">{kind === "site" ? "Site name (the part before .blackhole-ai-tech.com)" : "Game name (from its address)"}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase())}
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-400"
                />
              </label>
              </>
            )}
            <fieldset className="space-y-1.5">
              <legend className="text-sm text-slate-400 mb-1">What's wrong with it?</legend>
              {REASONS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="reason" value={key} checked={reason === key} onChange={() => setReason(key)} className="accent-red-400" />
                  {label}
                </label>
              ))}
            </fieldset>
            <label className="block text-sm">
              <span className="text-slate-400">Details (optional)</span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                rows={3}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-400 resize-none"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-medium rounded-lg py-2.5"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Send report
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              Sites on Blackhole AI are made by its users, not by Blackhole AI. See the{" "}
              <a href="/terms" className="underline">rules</a>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
