import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Code, Gem, Star, ChevronDown, Lock } from "lucide-react";

const OPTIONS = [
  { id: "ai", label: "AI", icon: Sparkles, color: "text-indigo-400" },
  { id: "code", label: "Blackhole Code", icon: Code, color: "text-emerald-300" },
  { id: "opus5", label: "Galaxy 5", icon: Gem, color: "text-sky-300" },
  { id: "fable", label: "Space 5", icon: Star, color: "text-fuchsia-300" },
];

export default function AiChooser({ value, onChange, plan, allowFable }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const canUse = (id) => {
    if (id === "ai" || id === "code") return true;
    if (id === "opus5") return allowFable && (plan === "pro" || plan === "team" || plan === "secret");
    if (id === "fable") return allowFable && (plan === "team" || plan === "secret");
    return false;
  };

  const current = OPTIONS.find((o) => o.id === value) || OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50 text-slate-200 text-xs font-medium hover:bg-slate-700/70 transition-colors"
      >
        <current.icon className={`w-3.5 h-3.5 ${current.color}`} />
        {current.label}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full mb-2 left-0 w-48 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl p-1 z-30"
          >
            {OPTIONS.map((o) => {
              const allowed = canUse(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={!allowed}
                  onClick={() => {
                    if (allowed) {
                      onChange(o.id);
                      setOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                    o.id === value ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60"
                  } ${!allowed ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    <o.icon className={`w-4 h-4 ${o.color}`} />
                    {o.label}
                  </span>
                  {!allowed && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                </button>
              );
            })}
            {!allowFable && (
              <p className="px-2.5 py-1 text-[10px] text-slate-500">Galaxy 5 & Space 5: Website Designer only</p>
            )}
            {allowFable && plan === "free" && (
              <p className="px-2.5 py-1 text-[10px] text-slate-500">Galaxy 5: Pro+ · Space 5: Team+</p>
            )}
            {allowFable && plan === "pro" && (
              <p className="px-2.5 py-1 text-[10px] text-slate-500">Space 5: Team plan only</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}