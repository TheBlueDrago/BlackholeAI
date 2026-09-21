import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Loader2, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

function FreeCard({ onFree }) {
  const features = ["50 Blackhole AI credits"];
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
          Credits are the units Blackhole AI uses when you interact with Blackhole AI's. Credit usage adjusts dynamically based on how much work the builder needs to do behind the scenes.
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
  const features = ["4 AI's (incl. Galaxy and Space in Website Designer)", "50 Blackhole Code credits", "100 Blackhole AI credits", "50 Galaxy credits", "50 Space credits", "Push to GitHub (no 2-way sync)", "Download a ZIP of your website or game in the designers"];
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
          Credits are the units Blackhole AI uses when you interact with Blackhole AI's. Credit usage adjusts dynamically based on how much work the builder needs to do behind the scenes.
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
    "4 AI's (incl. Galaxy and Space in Website Designer)",
    "100 Blackhole Code credits",
    "150 Blackhole AI credits",
    "100 Galaxy credits",
    "100 Space credits",
    "Add up to 2 people — everyone shares the credits",
    "Push to GitHub (no 2-way sync)",
    "Download a ZIP of your website or game in the designers",
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

export default function Subscriptions({ onFree, onPro, onTeam, onSecret }) {
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState("");

  const doRedeem = async () => {
    const code = promoInput.trim();
    if (!code || promoBusy) return;
    setPromoError("");
    setPromoBusy(true);
    try {
      const res = await base44.functions.invoke("redeem-promo", { code });
      navigate("/promo-success", { state: { aiModel: res.data?.aiModel, credits: res.data?.credits } });
    } catch (e) {
      setPromoError(e?.response?.data?.error || e?.message || "Could not redeem code.");
    } finally {
      setPromoBusy(false);
    }
  };

  const redeem = () => {
    if (!promoInput.trim() || promoBusy) return;
    doRedeem();
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

    </motion.div>
  );
}