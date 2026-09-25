import React, { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { studyModeOn, setStudyMode, onStudyMode } from "@/lib/studyMode";

// Chat toolbar switch: Study mode on (the AI tutors step by step) or off (it just answers).
export default function StudyModeButton() {
  const [on, setOn] = useState(studyModeOn);
  useEffect(() => onStudyMode(setOn), []);
  const label = on ? "Study mode is on: the AI guides you step by step. Tap to turn off." : "Study mode: the AI guides you step by step instead of giving the answer";
  return (
    <button
      type="button"
      onClick={() => setStudyMode(!on)}
      title={label}
      aria-label={label}
      aria-pressed={on}
      className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        on ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40" : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <GraduationCap className="w-4 h-4" />
      <span className={on ? "" : "hidden sm:inline"}>Study</span>
    </button>
  );
}
