import React from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ light, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={light ? "Switch to dark mode" : "Switch to light mode"}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      className="keep-color w-10 h-10 rounded-full bg-slate-800/70 border border-slate-700/50 flex items-center justify-center text-amber-300 hover:bg-slate-700/70 transition-colors shadow-lg shrink-0"
    >
      {light ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}