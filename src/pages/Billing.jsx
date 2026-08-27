import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShieldCheck, Users, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function Billing() {
  const navigate = useNavigate();
  const location = useLocation();
  const productId = location.state?.productId ?? "pro";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const PLANS = {
    secret: {
      name: "Secret Plan",
      price: "$0.50 / month",
      gradient: "from-slate-800 to-black",
      glow: "bg-fuchsia-600/10",
      features: ["5 people total — invite up to 4", "∞ normal AI credits", "∞ AI code credits"],
      button: "Subscribe — $0.50/mo",
      icon: Lock,
    },
    team: {
      name: "Team Plan",
      price: "$10 / month",
      gradient: "from-sky-500 to-indigo-500",
      glow: "bg-sky-600/15",
      features: ["2 AI's", "1000 AI code credits", "∞ normal AI credits", "Add up to 2 people — shared credits"],
      button: "Subscribe — $10/mo",
      icon: Users,
    },
    pro: {
      name: "Pro Plan",
      price: "$1 / month",
      gradient: "from-emerald-500 to-teal-500",
      glow: "bg-emerald-600/15",
      features: ["2 AI's", "100 AI code credits", "∞ normal AI credits"],
      button: "Subscribe — $1/mo",
      icon: ShieldCheck,
    },
  };
  const plan = PLANS[productId] ?? PLANS.pro;

  const startCheckout = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("create-checkout", { productId });
      const redirectUrl = res.data?.redirectUrl;
      if (!redirectUrl) throw new Error("No checkout URL");
      window.location.href = redirectUrl;
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not start checkout");
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
      <p className="text-slate-400 mt-3 text-center">Upgrade to {productId === "secret" ? "Secret" : productId === "team" ? "Team" : "Pro"}</p>

      <div className="mt-10 w-full max-w-md bg-slate-900/70 backdrop-blur-xl border border-slate-700/40 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            <p className="text-slate-400 text-sm">{plan.price}</p>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5 text-slate-200 text-sm">
          {plan.features.map((f) => (
            <li key={f}>• {f}</li>
          ))}
        </ul>

        <p className="mt-5 pt-4 border-t border-slate-700/40 text-xs text-slate-400 leading-relaxed">
          Credits are the units Base44 uses when you interact with Base44's AI or connect your app to external tools. Credit usage adjusts dynamically based on how much work the builder needs to do behind the scenes.
        </p>

        {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

        <button
          onClick={startCheckout}
          disabled={loading}
          className={`mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br ${plan.gradient} text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : plan.button}
        </button>
        <p className="mt-3 text-center text-xs text-slate-500">Secure checkout via Base44 Payments</p>
      </div>
    </motion.div>
  );
}