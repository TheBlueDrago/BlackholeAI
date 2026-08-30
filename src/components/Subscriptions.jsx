import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Loader2, Gift, Users, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

function FreeCard({ onFree }) {
  const features = ["10 Blackhole AI credits", "2 AI's (AI + Blackhole Code)", "5 Blackhole Code credits"];
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-indigo-500/60 rounded-3xl p-6 shadow-2xl shadow-indigo-500/10 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Free</h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
          Current
        </span>
      </div>
      <div className="h-px bg-slate-700/60 my-4" />
      <ul className="space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-slate-200 text-sm">
            <Check className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-4 border-t border-slate-700/40">
        <p className="text-xs text-slate-400 leading-relaxed">
          Credits are the units Base44 uses when you interact with Base44's AI or connect your app to external tools. Credit usage adjusts dynamically based on how much work the builder needs to do behind the scenes.
        </p>
      </div>
      <button
        onClick={onFree}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500/90 text-white font-medium hover:bg-indigo-500 transition-colors"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Plan2Card({ onPro }) {
  const features = ["3 AI's (incl. Galaxy 5 in Website Designer)", "15 Blackhole Code credits", "25 Blackhole AI credits", "25 Galaxy 5 credits"];
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl shadow-emerald-500/10 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Pro</h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          $1/mo
        </span>
      </div>
      <div className="h-px bg-slate-700/60 my-4" />
      <ul className="space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-slate-200 text-sm">
            <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-4 border-t border-slate-700/40">
        <p className="text-xs text-slate-400 leading-relaxed">
          Credits are the units Base44 uses when you interact with Base44's AI or connect your app to external tools. Credit usage adjusts dynamically based on how much work the builder needs to do behind the scenes.
        </p>
      </div>
      <button
        onClick={onPro}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-medium hover:opacity-90 transition-opacity"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function TeamCard({ onTeam }) {
  const features = [
    "4 AI's (Galaxy 5 and Space 5 in Website Designer)",
    "1000 Blackhole Code credits",
    "∞ Blackhole AI credits",
    "∞ Galaxy 5 credits",
    "Add up to 2 people — everyone shares the credits",
  ];
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-sky-500/60 rounded-3xl p-6 shadow-2xl shadow-sky-500/10 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Team</h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
          $10/mo
        </span>
      </div>
      <div className="h-px bg-slate-700/60 my-4" />
      <ul className="space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-slate-200 text-sm">
            <Check className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-4 border-t border-slate-700/40">
        <p className="text-xs text-slate-400 leading-relaxed">
          Invite up to 2 people to your plan (3 with you). You all draw from the same pool — if someone wastes
          100 credits, the whole team's credits go down.
        </p>
      </div>
      <button
        onClick={onTeam}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white font-medium hover:opacity-90 transition-opacity"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function TeamPanel() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    base44.functions
      .invoke("my-team")
      .then((r) => setTeam(r.data?.team ?? null))
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, []);

  const addMember = async () => {
    const e = emailInput.trim().toLowerCase();
    if (!e || busy) return;
    setErr("");
    setBusy(true);
    try {
      const r = await base44.functions.invoke("team-invite", { emails: [e] });
      setTeam((t) => (t ? { ...t, memberEmails: r.data?.memberEmails ?? t.memberEmails } : t));
      setEmailInput("");
    } catch (ex) {
      setErr(ex?.response?.data?.error || ex?.message || "Could not add member.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !team || !team.isOwner) return null;
  const members = team.memberEmails ?? [];
  const isSecretTeam = team.ownerPlan === "secret";
  const memberCap = isSecretTeam ? 4 : 2;

  return (
    <div className="mt-12 w-full max-w-md mx-auto bg-slate-900/70 backdrop-blur-xl border border-sky-500/40 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-sky-300" />
        <h3 className="text-lg font-bold text-white">Your Team</h3>
      </div>
      <p className="text-slate-400 text-sm">
        Shared Blackhole Code credits:{" "}
        <span className="text-sky-200 font-medium">
          {isSecretTeam ? "Unlimited" : `${team.aiCodeUsed ?? 0} / 1000`}
        </span>
      </p>

      <div className="mt-4">
        <p className="text-slate-300 text-sm font-medium mb-2">
          Members {members.length}/{memberCap + 1}
        </p>
        <div className="space-y-2">
          {members.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2"
            >
              <span className="text-slate-200 text-sm truncate">{m}</span>
              <X className="w-4 h-4 text-slate-500" />
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-slate-500 text-sm">No members yet.</p>
          )}
        </div>

        {members.length < memberCap && (
          <div className="flex items-center gap-2 mt-3">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addMember();
              }}
              placeholder="teammate@email.com"
              className="flex-1 bg-slate-800/70 border border-slate-700/50 focus:border-sky-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors"
            />
            <button
              onClick={addMember}
              disabled={busy || !emailInput.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
        )}
        {err && <p className="text-sm text-red-400 mt-2">{err}</p>}
        <p className="text-xs text-slate-500 mt-3">
          Added members share your credits. Tell them to create an account with the email you
          invited.
        </p>
      </div>
    </div>
  );
}

export default function Subscriptions({ onFree, onPro, onTeam, onSecret }) {
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [showChangeConfirm, setShowChangeConfirm] = useState(false);

  useEffect(() => {
    base44.auth
      .me()
      .then((u) => {
        const active =
          u?.plan && u.plan !== "free" && (!u.planExpiresAt || new Date(u.planExpiresAt) > new Date());
        setCurrentPlan(active ? u.plan : "free");
      })
      .catch(() => setCurrentPlan("free"));
  }, []);

  const doRedeem = async (force = false) => {
    const code = promoInput.trim();
    if (!code || promoBusy) return;
    setPromoError("");
    setPromoBusy(true);
    try {
      const res = await base44.functions.invoke("redeem-promo", { code, force });
      navigate("/promo-success", { state: { expiresAt: res.data?.expiresAt } });
    } catch (e) {
      setPromoError(e?.response?.data?.error || e?.message || "Could not redeem code.");
    } finally {
      setPromoBusy(false);
    }
  };

  const redeem = () => {
    if (!promoInput.trim() || promoBusy) return;
    if (currentPlan !== "free") {
      setShowChangeConfirm(true);
      return;
    }
    doRedeem(false);
  };

  return (
    <motion.div
      key="subscriptions"
      className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6, ease: "easeInOut" } }}
    >
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center">
        <button
          type="button"
          onClick={onSecret}
          className="bg-gradient-to-r from-white via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent cursor-pointer select-none"
        >
          Subscriptions
        </button>
      </h1>
      <p className="text-slate-400 mt-3 text-center">Choose the plan that fits you</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 max-w-5xl w-full">
        <FreeCard onFree={onFree} />
        <Plan2Card onPro={onPro} />
        <TeamCard onTeam={onTeam} />
      </div>

      <TeamPanel />

      <div className="mt-10 w-full max-w-md mx-auto">
        <button
          onClick={onFree}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white font-medium hover:opacity-90 transition-opacity"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Promo code */}
      <div className="mt-12 w-full max-w-md mx-auto">
        <p className="text-center text-slate-300 text-sm font-medium mb-3">Have A Promo Code?</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") redeem();
            }}
            placeholder="Enter promo code"
            className="flex-1 bg-slate-800/70 border border-slate-700/50 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors uppercase tracking-wide"
          />
          <button
            onClick={redeem}
            disabled={promoBusy || !promoInput.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {promoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
            Redeem
          </button>
        </div>
        {promoError && <p className="text-center text-sm text-red-400 mt-2">{promoError}</p>}
      </div>

      <AnimatePresence>
        {showChangeConfirm && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowChangeConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-slate-900 border border-slate-700/60 rounded-2xl p-6 text-center"
            >
              <p className="text-slate-200 text-base font-medium">Are you sure you want to change plans?</p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowChangeConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowChangeConfirm(false);
                    doRedeem(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-medium hover:opacity-90"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}