import React from "react";
import { TrendingUp } from "lucide-react";

const DAY = 86400000;
// Base44 dates can lack a time zone; they're UTC.
const when = (d) => Date.parse(/Z|[+-]\d\d:?\d\d$/.test(String(d || "")) ? d : `${d}Z`);

// Monitor → Growth: sign-ups today, this week and this month, and a bar per day for the last
// 14 days, from the accounts Monitor already loaded (newest 200; `complete` is false when
// there are more).
export default function GrowthCard({ users, complete }) {
  const now = Date.now();
  const times = users.map((u) => when(u.created_date)).filter(Number.isFinite);
  const since = (days) => times.filter((t) => now - t < days * DAY).length;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const from = startOfToday.getTime() - (13 - i) * DAY;
    return { from, count: times.filter((t) => t >= from && t < from + DAY).length };
  });
  const max = Math.max(1, ...days.map((d) => d.count));
  const stats = [
    ["Today", times.filter((t) => t >= startOfToday.getTime()).length],
    ["Last 7 days", since(7)],
    ["Last 30 days", since(30)],
    ["All accounts", complete ? times.length : `${times.length}+`],
  ];

  return (
    <div className="w-full max-w-3xl mt-6 bg-slate-900/70 border border-slate-700/50 rounded-2xl p-4">
      <p className="flex items-center gap-2 text-white font-semibold text-sm">
        <TrendingUp className="w-4 h-4 text-emerald-300" /> Growth
      </p>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-2">
            <p className="text-[11px] text-slate-400">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-slate-400">New accounts per day, last 14 days</p>
      <div className="mt-2 flex items-end gap-1 h-24" role="img" aria-label={`New accounts per day: ${days.map((d) => d.count).join(", ")}`}>
        {days.map((d) => (
          <div key={d.from} className="flex-1 flex flex-col items-center justify-end h-full" title={`${new Date(d.from).toLocaleDateString()}: ${d.count}`}>
            {d.count > 0 && <span className="text-[10px] text-slate-400 mb-0.5">{d.count}</span>}
            <div className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-fuchsia-400" style={{ height: `${Math.max(d.count ? 6 : 2, (d.count / max) * 100)}%`, opacity: d.count ? 1 : 0.25 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>{new Date(days[0].from).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
