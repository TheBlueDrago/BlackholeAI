import React, { useEffect, useState } from "react";
import { currentStreak, bestStreak, onStreak } from "@/lib/streak";

// "🔥 3 days" in the chat toolbar: days in a row with a question to the AI (lib/streak.js).
export default function StreakChip({ userId }) {
  const [n, setN] = useState(() => currentStreak(userId));
  useEffect(() => {
    setN(currentStreak(userId));
    return onStreak(setN);
  }, [userId]);
  if (n < 1) return null;
  const best = bestStreak(userId);
  const label = `${n}-day streak: you've asked the AI something ${n === 1 ? "today" : `${n} days in a row`}.${best > n ? ` Your best is ${best} days.` : ""} Come back tomorrow to keep it going.`;
  return (
    <span title={label} aria-label={label} className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-[11px] font-semibold text-orange-300 select-none">
      <span aria-hidden="true">🔥</span> {n} {n === 1 ? "day" : "days"}
    </span>
  );
}
