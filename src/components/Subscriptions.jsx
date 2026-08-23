import React from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

function FreeCard() {
  const features = [
    "10 AI credits per month",
    "1 type of ai",
    "10 ai chats only",
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

export default function Subscriptions({ onContinue }) {
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
        <FreeCard />
        <PlaceholderCard label="Plan 2" />
        <PlaceholderCard label="Plan 3" />
      </div>

      <div className="h-px bg-slate-700/50 max-w-5xl w-full mt-10" />

      <button
        onClick={onContinue}
        className="mt-6 inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white font-medium shadow-lg shadow-indigo-500/30 hover:opacity-90 transition-opacity"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}