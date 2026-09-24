import React, { useState } from "react";
import { Crown, Ban, Clock, ShieldCheck, EyeOff } from "lucide-react";
import { base44 } from "@/api/base44Client";

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

  const who = user.email || "this account";
  const applyPlan = () => {
    // Giving away a paid plan is confirmed first (it's worth money, and one click did it).
    if (plan !== "free" && !window.confirm(`Give ${who} the ${plan} plan ${forever ? "forever" : `for ${days} day${days === 1 ? "" : "s"}`}?`)) return;
    let planExpiresAt = null;
    if (plan !== "free" && !forever) {
      planExpiresAt = new Date(Date.now() + days * UNIT_MS.days).toISOString();
    }
    run(plan === "enterprise" ? { plan, planExpiresAt, seats } : { plan, planExpiresAt });
  };

  const ban = () => {
    if (!window.confirm(`Ban ${who} forever? They can't use Blackhole AI until you unban them.`)) return;
    run({ banned: true, blockedUntil: null });
  };
  const block = () =>
    run({ banned: false, blockedUntil: new Date(Date.now() + bN * UNIT_MS[bUnit]).toISOString() });
  const unblock = () => run({ banned: false, blockedUntil: null });
  // Take down every site and game this account owns (admin-reports "hide-owner").
  const [takeNote, setTakeNote] = useState("");
  const takeDownAll = async () => {
    if (!window.confirm(`Take down every site and game ${who} owns? They go offline for everyone. You can put each back from Published sites & games.`)) return;
    setBusy(true);
    setTakeNote("");
    try {
      const r = await base44.functions.invoke("admin-reports", { action: "hide-owner", userId: user.id });
      const n = (r.data?.taken || []).length;
      setTakeNote(n ? `Took down ${n} page${n === 1 ? "" : "s"}.` : "They don't own any published pages.");
    } catch (e) {
      setTakeNote(e?.response?.data?.error || "Couldn't take their pages down.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Plan"
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
              aria-label="Seats"
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
              aria-label="Plan length in days"
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
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-[#fff] text-xs font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          <Crown className="w-3.5 h-3.5" /> Set membership
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={ban}
          disabled={busy || isBanned}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-700 text-[#fff] text-xs font-medium hover:bg-red-600 disabled:opacity-50"
        >
          <Ban className="w-3.5 h-3.5" /> Ban forever
        </button>
        <input
          type="number"
          min={1}
          value={bN}
          aria-label="Block for how long"
          onChange={(e) => setBN(Math.max(1, Number(e.target.value) || 1))}
          className="w-14 bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
        />
        <select
          value={bUnit}
          aria-label="Block length unit"
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
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-700 text-[#fff] text-xs font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          <Clock className="w-3.5 h-3.5" /> Block
        </button>
        {(isBanned || isBlocked) && (
          <button
            onClick={unblock}
            disabled={busy}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-[#fff] text-xs font-medium hover:bg-emerald-600 disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Unblock / unban
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-500">
        A ban or block stops them using the AI, publishing, promo codes, referral credits and team invites. Pages they already published stay up until you
        take them down.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={takeDownAll}
          disabled={busy}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-100 text-xs font-medium hover:bg-slate-600 disabled:opacity-50"
        >
          <EyeOff className="w-3.5 h-3.5" /> Take down all their pages
        </button>
        {takeNote && <span className="text-[11px] text-slate-400">{takeNote}</span>}
      </div>
    </div>
  );
}