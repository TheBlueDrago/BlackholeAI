import { useState, useEffect, useCallback } from "react";

const KEY = "infinity-ai-credits-v2";
const DEFAULTS = { aiTotal: 10, aiUsed: 0, aiCodeTotal: 5, aiCodeUsed: 0 };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

export function useCredits() {
  const [credits, setCredits] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(credits));
    } catch {}
  }, [credits]);

  const spendAI = useCallback((amount = 1) => {
    setCredits((c) => ({ ...c, aiUsed: Math.min(c.aiUsed + amount, c.aiTotal) }));
  }, []);

  const spendAICode = useCallback((amount = 1) => {
    setCredits((c) => ({ ...c, aiCodeUsed: Math.min(c.aiCodeUsed + amount, c.aiCodeTotal) }));
  }, []);

  const aiRemaining = Math.max(0, credits.aiTotal - credits.aiUsed);
  const aiCodeRemaining = Math.max(0, credits.aiCodeTotal - credits.aiCodeUsed);

  return {
    aiTotal: credits.aiTotal,
    aiUsed: credits.aiUsed,
    aiCodeTotal: credits.aiCodeTotal,
    aiCodeUsed: credits.aiCodeUsed,
    aiRemaining,
    aiCodeRemaining,
    aiExhausted: aiRemaining <= 0,
    aiCodeExhausted: aiCodeRemaining <= 0,
    spendAI,
    spendAICode,
  };
}