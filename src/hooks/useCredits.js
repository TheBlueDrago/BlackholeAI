import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const KEY = "infinity-ai-credits-v2";
const FREE = { aiTotal: 10, aiCodeTotal: 5, galaxy5Total: 0 };
const PRO = { aiTotal: 25, aiCodeTotal: 15, galaxy5Total: 25 };
const TEAM = { aiTotal: 50, aiCodeTotal: 25, galaxy5Total: Infinity };
const SECRET = { aiTotal: Infinity, aiCodeTotal: Infinity, galaxy5Total: Infinity };

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function loadUsed() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      // New calendar month → reset to plan total (unused credits don't stack).
      if (p.periodKey && p.periodKey !== monthKey()) {
        return { aiUsed: 0, aiCodeUsed: 0, galaxy5Used: 0 };
      }
      return { aiUsed: p.aiUsed ?? 0, aiCodeUsed: p.aiCodeUsed ?? 0, galaxy5Used: p.galaxy5Used ?? 0 };
    }
  } catch {}
  return { aiUsed: 0, aiCodeUsed: 0, galaxy5Used: 0 };
}

// Effective plan: Pro only counts while not expired (promo grants carry planExpiresAt).
function effectivePlan(user) {
  if (!user) return "free";
  if (user.role === "admin") return "secret";
  if (user.plan === "secret") return "secret";
  if (user.plan !== "pro") return "free";
  if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) return "free";
  return "pro";
}

export function useCredits() {
  const [used, setUsed] = useState(loadUsed);
  const [plan, setPlan] = useState("free");
  const [team, setTeam] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (!active) return;
        setPlan(effectivePlan(u));
        const r = await base44.functions.invoke("my-team").catch(() => null);
        const t = r?.data?.team;
        if (active && t && t.active) {
          setTeam(t);
          if (!t.isAdmin) setPlan(t.ownerPlan === "secret" ? "secret" : "team");
        } else if (active) {
          setTeam(null);
        }
      } catch {
        if (active) {
          setPlan("free");
          setTeam(null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...used, periodKey: monthKey() }));
    } catch {}
  }, [used]);

  const totals = plan === "pro" ? PRO : plan === "team" ? TEAM : plan === "secret" ? SECRET : FREE;

  const aiTotal = totals.aiTotal;
  const aiCodeTotal = team?.isAdmin ? Infinity : totals.aiCodeTotal;
  const galaxy5Total = totals.galaxy5Total;
  const aiUsed = plan === "secret" ? 0 : used.aiUsed;
  const aiCodeUsed = plan === "team" ? team?.aiCodeUsed ?? 0 : plan === "secret" ? 0 : used.aiCodeUsed;
  const galaxy5Used = plan === "team" || plan === "secret" ? 0 : used.galaxy5Used;

  const spendAI = useCallback(
    (amount = 1) => {
      if (plan === "secret") return; // unlimited
      setUsed((u) => ({ ...u, aiUsed: u.aiUsed + amount }));
    },
    [plan]
  );

  const spendGalaxy5 = useCallback(
    (amount = 1) => {
      if (plan === "team" || plan === "secret") return; // unlimited
      setUsed((u) => ({ ...u, galaxy5Used: u.galaxy5Used + amount }));
    },
    [plan]
  );

  const spendAICode = useCallback(
    (amount = 1) => {
      if (plan === "secret") return; // unlimited
      if (plan === "team") {
        if (team?.isAdmin) return; // admins: free forever, no shared-pool counting
        // Shared pool lives on the server so every member's spend counts.
        base44.functions
          .invoke("team-spend", { amount })
          .then((r) => {
            const newUsed = r?.data?.aiCodeUsed;
            if (typeof newUsed === "number") {
              setTeam((t) => (t ? { ...t, aiCodeUsed: newUsed } : t));
            }
          })
          .catch(() => {});
        return;
      }
      setUsed((u) => ({ ...u, aiCodeUsed: Math.min(u.aiCodeUsed + amount, aiCodeTotal) }));
    },
    [plan, aiCodeTotal]
  );

  const aiRemaining = aiTotal === Infinity ? Infinity : Math.max(0, aiTotal - aiUsed);
  const aiCodeRemaining = Math.max(0, aiCodeTotal - aiCodeUsed);
  const galaxy5Remaining = galaxy5Total === Infinity ? Infinity : Math.max(0, galaxy5Total - galaxy5Used);
  const aiExhausted = aiRemaining <= 0;
  const aiCodeExhausted = aiCodeRemaining <= 0;
  const galaxy5Exhausted = galaxy5Remaining <= 0;

  return {
    aiTotal,
    aiUsed,
    aiCodeTotal,
    aiCodeUsed,
    galaxy5Total,
    galaxy5Used,
    aiRemaining,
    aiCodeRemaining,
    galaxy5Remaining,
    aiExhausted,
    aiCodeExhausted,
    galaxy5Exhausted,
    plan,
    team,
    spendAI,
    spendAICode,
    spendGalaxy5,
  };
}