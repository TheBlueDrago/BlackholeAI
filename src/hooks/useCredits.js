import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const KEY = "infinity-ai-credits-v2";
const FREE = { aiTotal: 10, aiCodeTotal: 5 };
const PRO = { aiTotal: Infinity, aiCodeTotal: 100 };

function loadUsed() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { aiUsed: p.aiUsed ?? 0, aiCodeUsed: p.aiCodeUsed ?? 0 };
    }
  } catch {}
  return { aiUsed: 0, aiCodeUsed: 0 };
}

// Effective plan: Pro only counts while not expired (promo grants carry planExpiresAt).
function effectivePlan(user) {
  if (!user || user.plan !== "pro") return "free";
  if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) return "free";
  return "pro";
}

export function useCredits() {
  const [used, setUsed] = useState(loadUsed);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    let active = true;
    base44.auth.me()
      .then((u) => { if (active) setPlan(effectivePlan(u)); })
      .catch(() => { if (active) setPlan("free"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(used)); } catch {}
  }, [used]);

  const totals = plan === "pro" ? PRO : FREE;

  const spendAI = useCallback((amount = 1) => {
    setUsed((u) => ({ ...u, aiUsed: u.aiUsed + amount }));
  }, []);
  const spendAICode = useCallback((amount = 1) => {
    setUsed((u) => ({ ...u, aiCodeUsed: Math.min(u.aiCodeUsed + amount, totals.aiCodeTotal) }));
  }, [totals.aiCodeTotal]);

  const aiTotal = totals.aiTotal;
  const aiCodeTotal = totals.aiCodeTotal;
  const aiRemaining = aiTotal === Infinity ? Infinity : Math.max(0, aiTotal - used.aiUsed);
  const aiCodeRemaining = Math.max(0, aiCodeTotal - used.aiCodeUsed);
  const aiExhausted = aiRemaining <= 0;
  const aiCodeExhausted = aiCodeRemaining <= 0;

  return {
    aiTotal,
    aiUsed: used.aiUsed,
    aiCodeTotal,
    aiCodeUsed: used.aiCodeUsed,
    aiRemaining,
    aiCodeRemaining,
    aiExhausted,
    aiCodeExhausted,
    plan,
    spendAI,
    spendAICode,
  };
}