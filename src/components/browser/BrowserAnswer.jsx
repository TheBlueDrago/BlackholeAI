import React from "react";
import { Loader2 } from "lucide-react";
import BlackholeIcon from "@/components/BlackholeIcon";

export default function BrowserAnswer({ loading, label, answer }) {
  if (!loading && !answer) return null;
  return (
    <div className="mb-7 rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shrink-0">
          <BlackholeIcon className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold text-slate-200">Blackhole AI</span>
        {label && <span className="text-[11px] text-slate-500">· {label}</span>}
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
        </div>
      ) : (
        <p className="text-slate-100 text-[15px] leading-relaxed whitespace-pre-wrap">{answer}</p>
      )}
    </div>
  );
}