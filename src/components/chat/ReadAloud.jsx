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

// What's being read right now, shared so the right reply's button shows Stop even when the
// reading was started by talk-back (a question asked with the mic is answered out loud).
let current = null; // { text, u }
const listeners = new Set();
const setCurrent = (c) => {
  current = c;
  listeners.forEach((f) => f(c?.text ?? null));
};

export const canSpeak = () => !!synth;

export function speakText(text) {
  if (!synth || !text) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(speakable(text).slice(0, 4000));
  u.lang = navigator.language || "en-US";
  u.onend = u.onerror = () => {
    if (current?.u === u) setCurrent(null);
  };
  setCurrent({ text, u });
  synth.speak(u);
}

export function stopSpeaking() {
  if (!synth) return;
  synth.cancel();
  setCurrent(null);
}

// Phones (Safari especially) only let a page speak after a tap; saying nothing during the
// Send tap lets the answer be read when it arrives a few seconds later.
export function unlockSpeech() {
  try {
    synth?.speak(new SpeechSynthesisUtterance(""));
  } catch {
    // Nothing to unlock.
  }
}

// Reads an AI reply out loud with the device's own voice (free, nothing is sent anywhere).
// Hidden where the browser can't speak. Pressing it again, or another reply's button, stops it.
export default function ReadAloud({ text }) {
  const [now, setNow] = useState(() => current?.text ?? null);
  useEffect(() => {
    listeners.add(setNow);
    return () => listeners.delete(setNow);
  }, []);
  if (!synth) return null;
  const speaking = now === text;
  const toggle = () => (speaking ? stopSpeaking() : speakText(text));

  const label = speaking ? "Stop reading" : "Read aloud";
  return (
    <button type="button" onClick={toggle} title={label} aria-label={label} className="p-1 rounded-md text-slate-500 hover:text-slate-200">
      {speaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
    </button>
  );
}
