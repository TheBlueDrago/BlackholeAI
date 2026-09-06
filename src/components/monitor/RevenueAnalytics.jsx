import React, { useState, useEffect } from "react";
import { Loader2, TrendingUp, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const money = (n) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;

export default function RevenueAnalytics() {
  const [sales, setSales] = useState(null);

  useEffect(() => {
    base44.entities.SiteSale.filter({ status: "paid" }, "-paidAt", 500)
      .then((rows) => setSales(rows || []))
      .catch(() => setSales([]));
  }, []);

  if (!sales) {
    return (
      <div className="w-full max-w-3xl mt-6 flex justify-center text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const num = (v) => parseFloat(v || "0") || 0;
  const gross = sales.reduce((s, r) => s + num(r.gross), 0);
  const fees = sales.reduce((s, r) => s + num(r.platformFee), 0);
  const payouts = sales.reduce((s, r) => s + num(r.creatorPayout), 0);

  const bySite = {};
  sales.forEach((r) => {
    const k = r.siteName || "unknown";
    bySite[k] = bySite[k] || { gross: 0, payout: 0, count: 0 };
    bySite[k].gross += num(r.gross);
    bySite[k].payout += num(r.creatorPayout);
    bySite[k].count += 1;
  });
  const top = Object.entries(bySite).sort((a, b) => b[1].gross - a[1].gross);
  const max = top[0]?.[1].gross || 1;

  return (
    <div className="w-full max-w-3xl mt-8">
      <p className="text-slate-300 text-sm font-medium inline-flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-300" /> Site sales analytics
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
        {[
          ["Total revenue", money(gross)],
          ["Platform fees", money(fees)],
          ["Creator payouts", money(payouts)],
          ["Paid orders", String(sales.length)],
        ].map(([label, value]) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <p className="text-slate-400 text-xs">{label}</p>
            <p className="text-white text-lg font-semibold mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        <p className="text-slate-300 text-sm font-medium">Top earning sites</p>
        {top.length === 0 && <p className="text-slate-500 text-sm">No paid sales yet.</p>}
        {top.map(([name, s]) => (
          <div key={name} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-200 text-sm inline-flex items-center gap-1.5 truncate">
                <Globe className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                {name}
                <span className="text-sky-300">.blackhole</span>
              </span>
              <span className="text-white text-sm font-semibold shrink-0">{money(s.gross)}</span>
            </div>
            <div className="h-1.5 mt-2 bg-slate-700/60 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: `${(s.gross / max) * 100}%` }} />
            </div>
            <p className="text-slate-500 text-xs mt-1.5">
              {s.count} order{s.count === 1 ? "" : "s"} · {money(s.payout)} creator payout
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}