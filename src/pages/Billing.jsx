import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShieldCheck, Users, Zap } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { paymentError } from "@/lib/paymentError";
import { CREDIT_PACKS } from "../../cloudflare-lib/creditPacks.js";
import { TIER_NAMES } from "../../cloudflare-lib/planTotals.js";

// A one-time credit pack laid out like a plan (prices are checked again by create-checkout).
function packPlan(id) {
  const p = CREDIT_PACKS[id];
  const amount = Number(p.price);
  return {
    name: `${p.credits} ${TIER_NAMES[p.tier]} credits`,
    amount,
    price: `$${amount} one-time`,
    gradient: "from-amber-500 to-orange-500",
    glow: "bg-amber-600/15",
    features: [
      "One-time purchase, no subscription",
      "Added to your account as soon as the payment goes through",
      "They don't reset at the end of the month: they stay until you use them",
      "Used before your monthly credits",
    ],
    button: `Buy — $${amount}`,
    icon: Zap,
    pack: true,
  };
}

export default function Billing() {
  const navigate = useNavigate();
  const location = useLocation();
  const requested = location.state?.productId ?? "pro";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  // The new-member discount, if this account has it right now (checkout applies it itself).
  const [pct, setPct] = useState(0);
  useEffect(() => {
    base44.functions
      .invoke("credits")
      .then((r) => {
        const o = r.data?.offer;
        // The new-member discount is for plans only, not credit packs.
        setPct(o?.discountAvailable && !CREDIT_PACKS[requested] ? o.discountPct : 0);
      })
      .catch(() => {});
  }, [requested]);

  const PLANS = {
    team: {
      name: "Team Plan",
      amount: 5,
      price: "$5 / month",
      gradient: "from-sky-500 to-indigo-500",
      glow: "bg-sky-600/15",
      features: ["4 AI's (incl. Galaxy and Space)", "150 Blackhole AI credits / month", "100 Blackhole Code credits / month (shared)", "100 Galaxy credits / month", "100 Space credits / month", "Add up to 2 people — shared credits"],
      button: "Subscribe — $5/mo",
      icon: Users,
    },
    pro: {
      name: "Pro Plan",
      amount: 1,
      price: "$1 / month",
      gradient: "from-emerald-500 to-teal-500",
      glow: "bg-emerald-600/15",
      features: ["4 AI's (incl. Galaxy and Space)", "100 Blackhole AI credits / month", "50 Blackhole Code credits / month", "50 Galaxy credits / month", "50 Space credits / month"],
      button: "Subscribe — $1/mo",
      icon: ShieldCheck,
    },
  };
  // Only plans and credit packs can be bought here; anything else (e.g. the old Secret) is Pro.
  const productId = PLANS[requested] || CREDIT_PACKS[requested] ? requested : "pro";
  const plan = PLANS[productId] || packPlan(productId);

  const startCheckout = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("create-checkout", { productId });
      const redirectUrl = res.data?.redirectUrl;
      if (!redirectUrl) throw new Error("No checkout URL");
      window.location.href = redirectUrl;
    } catch (e) {
      setError(paymentError(e));
      setLoading(false);
    }
  };

  const Icon = plan.icon;

  return (
    <motion.div
      className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6, ease: "easeInOut" } }}
    >
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${plan.glow} rounded-full blur-[120px] pointer-events-none`} />

      <button
        onClick={() => navigate("/chat")}
        className="fixed top-5 left-5 z-30 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50 text-slate-200 hover:bg-slate-700/70 transition-colors"
        title="Back"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center">
        <span className="bg-gradient-to-r from-white via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent">
          Billing
        </span>
      </h1>
      <p className="text-slate-400 mt-3 text-center">{plan.pack ? "Buy credits" : `Upgrade to ${productId === "team" ? "Team" : "Pro"}`}</p>

      <div className="mt-10 w-full max-w-md bg-slate-900/70 backdrop-blur-xl border border-slate-700/40 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            <p className="text-slate-400 text-sm">
              {pct ? (
                <>
                  <s className="opacity-60">{plan.price}</s> ${(Math.round(plan.amount * (100 - pct)) / 100).toFixed(2)} / month · {pct}% off, yours for as long as you stay subscribed
                </>
              ) : (
                plan.price
              )}
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5 text-slate-200 text-sm">
          {plan.features.map((f) => (
            <li key={f}>• {f}</li>
          ))}
        </ul>

        <p className="mt-5 pt-4 border-t border-slate-700/40 text-xs text-slate-400 leading-relaxed">
          Credits are the units Blackhole AI uses when you interact with Blackhole AI or connect your app to external tools. Credit usage adjusts dynamically based on how much work the builder needs to do behind the scenes.
        </p>

        {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

        <label className="mt-5 flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-slate-600 bg-slate-800 accent-indigo-500 shrink-0"
          />
          <span className="text-xs text-slate-300 leading-relaxed">
            I agree and acknowledge that I am responsible for this purchase. If I get into trouble for
            buying this {plan.pack ? "credit pack" : "subscription"}, I take full responsibility for my decision.
          </span>
        </label>

        <button
          onClick={startCheckout}
          disabled={loading || !agreed}
          className={`mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br ${plan.gradient} text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : pct ? `Subscribe — $${(Math.round(plan.amount * (100 - pct)) / 100).toFixed(2)}/mo` : plan.button}
        </button>
        <p className="mt-3 text-center text-xs text-slate-500">
          Secure checkout via Base44 Payments ·{" "}
          <Link to="/terms" className="underline hover:text-slate-300">Terms</Link> ·{" "}
          <Link to="/privacy" className="underline hover:text-slate-300">Privacy</Link>
        </p>
      </div>
    </motion.div>
  );
}