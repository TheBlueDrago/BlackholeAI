import React from "react";
import { Hammer, MessageCircle } from "lucide-react";

export default function ModeToggle({ mode, onChange }) {
  const build = mode === "build";
  return (
    <button
      type="button"
      onClick={() => onChange(build ? "discuss" : "build")}
      title={build ? "Build mode: the AI creates. Click to switch to Discuss." : "Discuss mode: the AI only talks. Click to switch to Build."}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
        build
          ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-200 hover:bg-indigo-500/30"
          : "bg-slate-800/70 border-slate-700/50 text-slate-200 hover:bg-slate-700/70"
      }`}
    >
      {build ? <Hammer className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
      {build ? "Build" : "Discuss"}
    </button>
  );
}