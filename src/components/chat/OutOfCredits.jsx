import React, { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";
import { useAppShell } from "@/components/AppShellContext";
import { outOfCreditsOptions, nextRefresh, waitText } from "@/lib/creditRefresh";

const price = (n) => `$${n}`;

// Shown above the message box once the chosen AI is out of credits, like Base44: upgrade now
// for a price, or wait for the monthly refresh (with a live countdown). `tier` is "ai",
// "aiCode", "galaxy5" or "space5".
export default function OutOfCredits({ tier, canSwitch = true }) {
  const shell = useAppShell();
  const credits = shell?.credits;
  const [now, setNow] = useState(Date.now);
  const [refreshAt] = useState(() => nextRefresh());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  // The month turned over while the card was open: re-read credits so it goes away.
  const due = now >= refreshAt;
  useEffect(() => {
    if (due) credits?.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due]);

  const { name, upgrade, refresh } = outOfCreditsOptions(tier, credits, now);
  const wait = refresh ? waitText(refresh.at - now) : "";
  const day = refresh ? new Date(refresh.at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
  const cost = upgrade ? price(upgrade.salePrice || upgrade.price) : "";
  const otherAi = canSwitch && Object.entries(credits?.tiers || {}).some(([k, t]) => k !== tier && t.remaining > 0);

  const summary = upgrade && refresh
    ? `Upgrade to ${upgrade.name} for ${cost}/month, or wait ${wait} for your credits to refresh.`
    : upgrade
      ? `Your plan doesn't include ${name} credits each month. Upgrade to ${upgrade.name} for ${cost}/month to get ${upgrade.extra}.`
      : `Your credits refresh in ${wait}.`;

  return (
    <div className="mb-2 rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-500/10 to-indigo-500/10 px-4 py-3">
      <p className="text-sm font-semibold text-slate-100">You're out of {name} credits</p>
      <p className="text-xs text-slate-400 mt-0.5">{summary}</p>
      <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
        {upgrade && (
          <button
            onClick={() => shell?.goBilling(upgrade.id)}
            className="flex-1 text-left rounded-xl bg-indigo-500 hover:bg-indigo-400 transition-colors px-3 py-2"
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
              <Zap className="w-4 h-4 shrink-0" />
              <span>
                Upgrade to {upgrade.name} · {upgrade.salePrice && <s className="opacity-70 mr-1">{price(upgrade.price)}</s>}
                {cost}/mo
              </span>
            </span>
            <span className="block text-xs text-indigo-100 mt-0.5">
              +{upgrade.extra} {name} credits right away{upgrade.salePrice ? " · new-member price" : ""}
            </span>
          </button>
        )}
        {refresh && (
          <div className="flex-1 rounded-xl border border-slate-700/60 bg-slate-800/70 px-3 py-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
              <Clock className="w-4 h-4 text-slate-400" /> Wait {wait}
            </span>
            <span className="block text-xs text-slate-400 mt-0.5">
              {refresh.amount} {name} credits come back on <span className="whitespace-nowrap">{day}</span>
            </span>
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <button onClick={() => shell?.openProfile("refer")} className="font-medium text-amber-300 hover:text-amber-200">
          🎁 Invite a friend and you both get free credits
        </button>
        {otherAi && <span className="text-slate-500">or switch to an AI that still has credits</span>}
      </div>
    </div>
  );
}
