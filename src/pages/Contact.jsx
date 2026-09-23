import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Keys must match TOPICS in cloudflare-lib/contact.js.
const TOPICS = [
  ["account", "Account or sign-in"],
  ["billing", "Plans, credits or payments"],
  ["bug", "Something isn't working"],
  ["idea", "Idea or feedback"],
  ["other", "Something else"],
];

// Public: people can write to the Blackhole AI team; messages show in Monitor →
// Messages (functions/contact.js). Signed-in users are replied to at their account email.
export default function Contact() {
  const [signedInEmail, setSignedInEmail] = useState("");
  const [topic, setTopic] = useState("other");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => setSignedInEmail(u?.email || "")).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("contact", { action: "send", topic, message, email: signedInEmail || email });
      if (res.data?.error) setError(res.data.error);
      else setSent(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not send the message. Try again in a minute.");
    } finally {
      setBusy(false);
    }
  };

  const field = "mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-400";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Blackhole AI
        </Link>
        <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6">
          {sent ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h1 className="text-xl font-semibold text-white">Message sent</h1>
              <p className="text-sm text-slate-400">Thanks — we'll reply to {signedInEmail || email}.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-300" />
                <h1 className="text-xl font-semibold text-white">Contact us</h1>
              </div>
              <label className="block text-sm">
                <span className="text-slate-400">What's it about?</span>
                <select value={topic} onChange={(e) => setTopic(e.target.value)} className={field}>
                  {TOPICS.map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </label>
              {signedInEmail ? (
                <p className="text-sm text-slate-400">We'll reply to <span className="text-slate-200">{signedInEmail}</span>.</p>
              ) : (
                <label className="block text-sm">
                  <span className="text-slate-400">Your email (so we can reply)</span>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={field} />
                </label>
              )}
              <label className="block text-sm">
                <span className="text-slate-400">Message</span>
                <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value.slice(0, 2000))} className={`${field} resize-none`} />
              </label>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={busy || message.trim().length < 5}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium rounded-lg py-2.5"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Send
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                To report a published site or game, use the Report link on it. See our <Link to="/privacy" className="underline">Privacy Policy</Link>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
