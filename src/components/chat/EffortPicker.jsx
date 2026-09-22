import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { EFFORTS } from "@/lib/effort";

// Five little bars, filled up to the current level.
function Bars({ level, className = "" }) {
  return (
    <span className={`inline-flex items-end gap-[2px] h-3 ${className}`} aria-hidden="true">
      {EFFORTS.map((e, i) => (
        <span
          key={e.id}
          className={`w-[3px] rounded-sm ${i <= level ? "bg-amber-300" : "bg-slate-600"}`}
          style={{ height: `${4 + i * 2}px` }}
        />
      ))}
    </span>
  );
}

// Effort control for every AI: Low → UltraCode. Higher = slower, smarter, more credits.
export default function EffortPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const level = Math.max(0, EFFORTS.findIndex((e) => e.id === value));
  const current = EFFORTS[level];

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={`Effort: ${current.label}`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50 text-slate-200 text-xs font-medium hover:bg-slate-700/70 transition-colors"
      >
        <Bars level={level} />
        {current.label}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full mb-2 left-0 w-64 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl p-3 z-30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white">Effort</span>
              <span className="text-[11px] text-amber-300 font-medium">
                {current.label} · {current.mult}× credits
              </span>
            </div>
            {/* Slider: click a step (or use arrow keys) to pick the level. */}
            <div
              role="slider"
              tabIndex={0}
              aria-valuemin={0}
              aria-valuemax={EFFORTS.length - 1}
              aria-valuenow={level}
              aria-valuetext={current.label}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(EFFORTS[Math.min(EFFORTS.length - 1, level + 1)].id);
                if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(EFFORTS[Math.max(0, level - 1)].id);
              }}
              className="relative h-6 flex items-center outline-none focus-visible:ring-1 focus-visible:ring-amber-300/60 rounded"
            >
              <div className="absolute left-2 right-2 h-1 rounded-full bg-slate-700" />
              <div
                className="absolute left-2 h-1 rounded-full bg-gradient-to-r from-sky-400 to-amber-300"
                style={{ width: `calc((100% - 1rem) * ${level / (EFFORTS.length - 1)})` }}
              />
              <div className="relative w-full flex justify-between">
                {EFFORTS.map((e, i) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onChange(e.id)}
                    title={e.label}
                    className={`w-4 h-4 rounded-full border-2 transition-colors ${
                      i === level ? "bg-amber-300 border-amber-200" : i < level ? "bg-sky-400 border-sky-300" : "bg-slate-800 border-slate-600 hover:border-slate-400"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-slate-500">
              {EFFORTS.map((e) => (
                <span key={e.id} className={e.id === value ? "text-slate-200" : ""}>
                  {e.id === "ultracode" ? "Ultra" : e.label}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{current.hint}</p>
            <p className="mt-1 text-[10px] text-slate-500">Higher effort = slower, smarter replies that use more credits.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
