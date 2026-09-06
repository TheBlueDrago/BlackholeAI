import React from "react";
import { Check, Loader2 } from "lucide-react";

export default function SaveStatus({ state }) {
  const saving = state === "saving";
  return (
    <span
      title={saving ? "Auto-saving your project" : "Project auto-saved"}
      className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400 shrink-0"
    >
      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-emerald-400" />}
      {saving ? "Saving…" : "Saved"}
    </span>
  );
}