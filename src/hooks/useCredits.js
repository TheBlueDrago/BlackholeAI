import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const KEY = "infinity-ai-credits-v3";
const FREE = { aiTotal: 10, aiCodeTotal: 5, galaxy5Total: 0, space5Total: 0 };
const PRO = { aiTotal: 25, aiCodeTotal: 15, galaxy5Total: 25, space5Total: 0 };
const TEAM = { aiTotal: 50, aiCodeTotal: 25, galaxy5Total: 40, space5Total: 25 };
const SECRET = { aiTotal: 50, aiCodeTotal: 25, galaxy5Total: 40, space5Total: 25 };
const ADMIN = { aiTotal: 50, aiCodeTotal: 25, galaxy5Total: 40, space5Total: 25 };

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
        return { aiUsed: 0, aiCodeUsed: 0, galaxy5Used: 0, space5Used: 0 };
      }
      return { aiUsed: p.aiUsed ?? 0, aiCodeUsed: p.aiCodeUsed ?? 0, galaxy5Used: p.galaxy5Used ?? 0, space5Used: p.space5Used ?? 0 };
    }
  } catch {}
  return { aiUsed: 0, aiCodeUsed: 0, galaxy5Used: 0, space5Used: 0 };
}

// Effective plan: Pro only counts while not expired (promo grants carry planExpiresAt).
function effectivePlan(user) {
  if (!user) return "free";
  if (user.role === "admin") return "admin";
  if (user.plan === "secret") return "secret";
  if (user.plan !== "pro") return "free";
  if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) return "free";
  return "pro";
}

export function useCredits() {
  const [used, setUsed] = useState(loadUsed);
  const [plan, setPlan] = useState("free");
  const [team, setTeam] = useState(null);
  const [bonus, setBonus] = useState({ ai: 0, aiCode: 0, galaxy5: 0, space5: 0 });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (!active) return;
        setPlan(effectivePlan(u));
        setBonus({
          ai: Number(u?.bonus?.ai ?? 0),
          aiCode: Number(u?.bonus?.aiCode ?? 0),
          galaxy5: Number(u?.bonus?.galaxy5 ?? 0),
          space5: Number(u?.bonus?.space5 ?? 0),
        });
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

  const totals = plan === "pro" ? PRO : plan === "team" ? TEAM : plan === "secret" ? SECRET : plan === "admin" ? ADMIN : FREE;

  const aiTotal = totals.aiTotal === Infinity ? Infinity : totals.aiTotal + bonus.ai;
  const aiCodeTotal = totals.aiCodeTotal === Infinity ? Infinity : totals.aiCodeTotal + bonus.aiCode;
  const galaxy5Total = totals.galaxy5Total === Infinity ? Infinity : totals.galaxy5Total + bonus.galaxy5;
  const space5Total = totals.space5Total === Infinity ? Infinity : totals.space5Total + bonus.space5;
  const aiUsed = used.aiUsed;
  const aiCodeUsed = plan === "team" || plan === "secret" ? team?.aiCodeUsed ?? 0 : used.aiCodeUsed;
  const galaxy5Used = used.galaxy5Used;
  const space5Used = used.space5Used;

  const spendAI = useCallback(
    (amount = 1) => {
      if (bonus.ai > 0) {
        const next = { ...bonus, ai: bonus.ai - amount };
        setBonus(next);
        base44.auth.updateMe({ bonus: next }).catch(() => {});
        return;
      }
      setUsed((u) => ({ ...u, aiUsed: u.aiUsed + amount }));
    },
    [plan, bonus]
  );

  const spendGalaxy5 = useCallback(
    (amount = 1) => {
      if (bonus.galaxy5 > 0) {
        const next = { ...bonus, galaxy5: bonus.galaxy5 - amount };
        setBonus(next);
        base44.auth.updateMe({ bonus: next }).catch(() => {});
        return;
      }
      setUsed((u) => ({ ...u, galaxy5Used: u.galaxy5Used + amount }));
    },
    [plan, bonus]
  );

  const spendSpace5 = useCallback(
    (amount = 1) => {
      if (bonus.space5 > 0) {
        const next = { ...bonus, space5: bonus.space5 - amount };
        setBonus(next);
        base44.auth.updateMe({ bonus: next }).catch(() => {});
        return;
      }
      setUsed((u) => ({ ...u, space5Used: u.space5Used + amount }));
    },
    [plan, bonus]
  );

  const spendAICode = useCallback(
    (amount = 1) => {
      if (bonus.aiCode > 0) {
        const next = { ...bonus, aiCode: bonus.aiCode - amount };
        setBonus(next);
        base44.auth.updateMe({ bonus: next }).catch(() => {});
        return;
      }
      if (plan === "team" || plan === "secret") {
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
    [plan, bonus, team, aiCodeTotal]
  );

  const aiRemaining = aiTotal === Infinity ? Infinity : Math.max(0, aiTotal - aiUsed);
  const aiCodeRemaining = Math.max(0, aiCodeTotal - aiCodeUsed);
  const galaxy5Remaining = galaxy5Total === Infinity ? Infinity : Math.max(0, galaxy5Total - galaxy5Used);
  const space5Remaining = space5Total === Infinity ? Infinity : Math.max(0, space5Total - space5Used);
  const aiExhausted = aiRemaining <= 0;
  const aiCodeExhausted = aiCodeRemaining <= 0;
  const galaxy5Exhausted = galaxy5Remaining <= 0;
  const space5Exhausted = space5Remaining <= 0;

  return {
    aiTotal,
    aiUsed,
    aiCodeTotal,
    aiCodeUsed,
    galaxy5Total,
    galaxy5Used,
    space5Total,
    space5Used,
    aiRemaining,
    aiCodeRemaining,
    galaxy5Remaining,
    space5Remaining,
    aiExhausted,
    aiCodeExhausted,
    galaxy5Exhausted,
    space5Exhausted,
    plan,
    team,
    spendAI,
    spendAICode,
    spendGalaxy5,
    spendSpace5,
  };
}