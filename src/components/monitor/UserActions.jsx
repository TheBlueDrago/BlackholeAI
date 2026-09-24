import React, { useState } from "react";
import { Crown, Ban, Clock, ShieldCheck } from "lucide-react";

const UNIT_MS = { days: 86400000, months: 30 * 86400000, years: 365 * 86400000 };

export default function UserActions({ user, onApply }) {
  const [plan, setPlan] = useState(user.plan === "secret" ? "free" : user.plan || "free");
  const [seats, setSeats] = useState(5);
  const [days, setDays] = useState(30);
  const [forever, setForever] = useState(false);
  const [bN, setBN] = useState(1);
  const [bUnit, setBUnit] = useState("days");
  const [busy, setBusy] = useState(false);

  const isBanned = user.banned === true;
  const isBlocked = user.blockedUntil && new Date(user.blockedUntil) > new Date();

  const run = async (patch) => {
    setBusy(true);
    try {
      await onApply(user.id, patch);
    } finally {
      setBusy(false);
    }
  };

  const applyPlan = () => {
    let planExpiresAt = null;
    if (plan !== "free" && !forever) {
      planExpiresAt = new Date(Date.now() + days * UNIT_MS.days).toISOString();
    }
    run(plan === "enterprise" ? { plan, planExpiresAt, seats } : { plan, planExpiresAt });
  };

  const ban = () => run({ banned: true, blockedUntil: null });
  const block = () =>
    run({ banned: false, blockedUntil: new Date(Date.now() + bN * UNIT_MS[bUnit]).toISOString() });
  const unblock = () => run({ banned: false, blockedUntil: null });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
        >
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="team">Team</option>
          <option value="enterprise">Enterprise</option>
        </select>
        {plan === "enterprise" && (
          <>
            <input
              type="number"
              min={2}
              value={seats}
              onChange={(e) => setSeats(Math.max(2, Number(e.target.value) || 2))}
              className="w-16 bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
            />
            <span className="text-xs text-slate-400">seats</span>
          </>
        )}
        {(plan === "pro" || plan === "team" || plan === "enterprise") && (
          <>
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
            />
            <span className="text-xs text-slate-400">days</span>
            <label className="flex items-center gap-1 text-xs text-slate-400">
              <input type="checkbox" checked={forever} onChange={(e) => setForever(e.target.checked)} className="accent-sky-500" />
              forever
            </label>
          </>
        )}
        <button
          onClick={applyPlan}
          disabled={busy}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/90 text-white text-xs font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          <Crown className="w-3.5 h-3.5" /> Set membership
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={ban}
          disabled={busy || isBanned}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-xs font-medium hover:bg-red-500 disabled:opacity-50"
        >
          <Ban className="w-3.5 h-3.5" /> Ban forever
        </button>
        <input
          type="number"
          min={1}
          value={bN}
          onChange={(e) => setBN(Math.max(1, Number(e.target.value) || 1))}
          className="w-14 bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
        />
        <select
          value={bUnit}
          onChange={(e) => setBUnit(e.target.value)}
          className="bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
        >
          <option value="days">days</option>
          <option value="months">months</option>
          <option value="years">years</option>
        </select>
        <button
          onClick={block}
          disabled={busy || isBlocked}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500/90 text-white text-xs font-medium hover:bg-orange-500 disabled:opacity-50"
        >
          <Clock className="w-3.5 h-3.5" /> Block
        </button>
        {(isBanned || isBlocked) && (
          <button
            onClick={unblock}
            disabled={busy}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/90 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Unblock / unban
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-500">
        A ban or block stops them using the AI, publishing, promo codes, referral credits and team invites. Pages they already published stay up: take
        those down in Published sites &amp; games.
      </p>
    </div>
  );
}