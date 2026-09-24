import React from "react";
import { Sparkles, Code, Gem, Star } from "lucide-react";
import { packsForTier } from "../../../cloudflare-lib/creditPacks.js";
import { TIER_NAMES, TIERS } from "../../../cloudflare-lib/planTotals.js";
import { discountedPrice } from "../../../cloudflare-lib/discounts.js";
import { promoPctFor } from "@/lib/promoDiscount";

const LOOK = {
  ai: { icon: Sparkles, color: "text-indigo-300", border: "border-indigo-500/50" },
  aiCode: { icon: Code, color: "text-emerald-300", border: "border-emerald-500/50" },
  galaxy5: { icon: Gem, color: "text-sky-300", border: "border-sky-500/50" },
  space5: { icon: Star, color: "text-fuchsia-300", border: "border-fuchsia-500/50" },
};
const money = (n) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

// The shop's Credits section: one-time packs of 5-50 credits for every AI, for any plan.
// onBuy(productId) opens Billing on that pack; `discount` is a promo code the person entered.
export default function CreditPacks({ onBuy, discount }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {TIERS.map((tier) => {
        const { icon: Icon, color, border } = LOOK[tier];
        return (
          <div key={tier} className={`bg-slate-900/80 backdrop-blur-xl border-2 ${border} rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col`}>
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <h3 className="text-xl font-bold text-white">{TIER_NAMES[tier]} credits</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">One-time, any plan. They don't reset at the end of the month.</p>
            <div className="grid grid-cols-2 min-[380px]:grid-cols-4 gap-2 mt-4">
              {packsForTier(tier).map(([id, p]) => {
                const off = promoPctFor(discount, id);
                return (
                  <button
                    key={id}
                    onClick={() => onBuy(id)}
                    className="rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/70 hover:border-slate-500 transition-colors px-2 py-2.5 text-center"
                  >
                    <span className="block text-lg font-bold text-white">{p.credits}</span>
                    {off ? (
                      <span className="block text-xs text-slate-300 leading-tight">
                        <s className="block opacity-60">{money(Number(p.price))}</s>
                        <span className="text-emerald-300">{money(discountedPrice(p.price, off))}</span>
                      </span>
                    ) : (
                      <span className="block text-xs text-slate-300">{money(Number(p.price))}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
