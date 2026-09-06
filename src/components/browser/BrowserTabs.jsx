import React from "react";
import { Search, Globe, Gamepad2, Sparkles } from "lucide-react";

const TABS = [
  { id: "all", label: "All", icon: Search },
  { id: "web", label: "Web", icon: Globe },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "sites", label: "Blackhole Sites", icon: Sparkles },
];

export default function BrowserTabs({ value, onChange, counts = {} }) {
  return (
    <div className="border-b border-white/10 px-4 sm:px-8">
      <div className="max-w-2xl flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                active ? "border-sky-400 text-sky-300" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {counts[t.id] > 0 && <span className="text-[11px] text-slate-500">{counts[t.id]}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}