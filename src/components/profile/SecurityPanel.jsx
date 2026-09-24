import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, KeyRound, Loader2, Check, Flag, ExternalLink } from "lucide-react";

const TIPS = [
  "We'll never ask for your password, by email, phone or chat.",
  "Only sign in on blackhole-ai-tech.com. Check the address first.",
  "Use a password you don't use for anything else.",
  "Sign out on shared or school computers when you're done.",
  "Never type a password or card number into a site someone made. Report it instead.",
];

// Settings → Security: change password (by email link) and simple ways to stay safe.
export default function SecurityPanel({ email, onBack, onChangePassword, busy }) {
  return (
    <div className="p-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 text-sm hover:text-slate-200 transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-emerald-300" />
        <h3 className="text-lg font-semibold text-white">Security</h3>
      </div>
      {email && <p className="text-xs text-slate-500 mt-1 break-all">Signed in as {email}</p>}

      <button
        onClick={onChangePassword}
        disabled={busy || !email}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-400 transition-colors disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
        Change password
      </button>
      <p className="text-[11px] text-slate-500 mt-1.5 text-center">We'll email you a link to set a new one.</p>

      <p className="mt-5 text-slate-300 text-sm font-medium">Staying safe</p>
      <ul className="mt-2 space-y-2">
        {TIPS.map((t) => (
          <li key={t} className="flex items-start gap-2 text-xs text-slate-300">
            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
            <span>{t}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link to="/safety" className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-sm hover:bg-slate-700">
          <ExternalLink className="w-4 h-4" /> Trust & safety
        </Link>
        <Link to="/report" className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-sm hover:bg-slate-700">
          <Flag className="w-4 h-4" /> Report a page
        </Link>
      </div>
    </div>
  );
}
