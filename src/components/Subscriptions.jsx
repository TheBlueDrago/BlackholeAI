import React from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

function FreeCard({ onFree }) {
  const features = [
    "10 normal AI credits",
  ];
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
          Credits are spent based on how hard and how long your message is:
        </p>
        <ul className="mt-2 space-y-1 text-xs text-slate-400">
          <li>• One big paragraph, easy — 1.5 credits</li>
          <li>• One paragraph, hard — 2.5 credits</li>
          <li>• A whole-website request — 50+ credits</li>
        </ul>
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
  const features = [
    "2 AI's",
    "100 AI code credits",
    "∞ normal AI credits",
  ];
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
          Credits are spent based on how hard and how long your message is:
        </p>
        <ul className="mt-2 space-y-1 text-xs text-slate-400">
          <li>• One big paragraph, easy — 1.5 credits</li>
          <li>• One paragraph, hard — 2.5 credits</li>
          <li>• A whole-website request — 50+ credits</li>
        </ul>
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

function PlaceholderCard({ label }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/40 rounded-3xl p-6 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-500">{label}</h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-700/40 text-slate-400 border border-slate-600/40">
          Coming soon
        </span>
      </div>
      <div className="h-px bg-slate-700/40 my-4" />
      <div className="space-y-3 flex-1">
        <div className="h-4 rounded bg-slate-700/30" />
        <div className="h-4 rounded bg-slate-700/30 w-4/5" />
        <div className="h-4 rounded bg-slate-700/30 w-3/5" />
      </div>
    </div>
  );
}

export default function Subscriptions({ onFree, onPro }) {
  return (
    <motion.div
      key="subscriptions"
      className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6, ease: "easeInOut" } }}
    >
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center">
        <span className="bg-gradient-to-r from-white via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent">
          Subscriptions
        </span>
      </h1>
      <p className="text-slate-400 mt-3 text-center">Choose the plan that fits you</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 max-w-5xl w-full">
        <FreeCard onFree={onFree} />
        <Plan2Card onPro={onPro} />
        <PlaceholderCard label="Plan 3" />
      </div>

    </motion.div>
  );
}