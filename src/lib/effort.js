import { useState, useCallback } from "react";

// Effort levels for every AI. Higher levels let Gemini think longer (slower,
// smarter) and cost more credits; the server (chatCompletion.js / credits.js)
// applies the thinking settings and the credit multiplier.
export const EFFORTS = [
  { id: "low", label: "Low", mult: 1, hint: "Fastest replies. Great for quick questions." },
  { id: "medium", label: "Medium", mult: 1, hint: "Balanced speed and smarts. The default." },
  { id: "high", label: "High", mult: 2, hint: "Thinks longer for trickier builds and code." },
  { id: "extra", label: "Extra", mult: 3, hint: "Deep thinking for big, complex projects." },
  { id: "ultracode", label: "UltraCode", mult: 4, hint: "The smartest and slowest. For the hardest work." },
];
export const DEFAULT_EFFORT = "medium";
const KEY = "blackhole-effort";

function load() {
  try {
    const v = localStorage.getItem(KEY);
    return EFFORTS.some((e) => e.id === v) ? v : DEFAULT_EFFORT;
  } catch {
    return DEFAULT_EFFORT;
  }
}

export function useEffort() {
  const [effort, setEffortState] = useState(load);
  const setEffort = useCallback((v) => {
    setEffortState(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {}
  }, []);
  return [effort, setEffort];
}

const CODEY = /\b(code|function|script|program|html|css|javascript|python|java|sql|api|build|write|create|make|fix|bug|error|debug|implement|design|website|game|app)\b/i;

// At the default (Medium) level, short simple questions are answered at Low so
// they come back quickly and cost the minimum. Builds and code keep the chosen level.
export function effortFor(effort, text, { build }) {
  if (effort !== "medium" || build) return effort;
  const t = String(text || "").trim();
  return t.length <= 160 && !t.includes("\n") && !CODEY.test(t) ? "low" : effort;
}
