import React, { useEffect, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { mathToWords } from "@/lib/mathText";

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

// Markdown to plain speech: no code blocks, links read as their text, formulas as words, no symbols.
export function speakable(md) {
  return mathToWords(String(md || "").replace(/```[\s\S]*?```/g, " (code) "))
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_~>|]/g, "")
    .replace(/^\s*[-+]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Reads an AI reply out loud with the device's own voice (free, nothing is sent anywhere).
// Hidden where the browser can't speak. Pressing it again, or another reply's button, stops it.
export default function ReadAloud({ text }) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => speaking && synth?.cancel(), [speaking]);
  if (!synth) return null;

  const toggle = () => {
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text).slice(0, 4000));
    u.lang = navigator.language || "en-US";
    u.onend = u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  };

  const label = speaking ? "Stop reading" : "Read aloud";
  return (
    <button type="button" onClick={toggle} title={label} aria-label={label} className="p-1 rounded-md text-slate-500 hover:text-slate-200">
      {speaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
    </button>
  );
}
