import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function Billing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startCheckout = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("create-checkout", { productId: "pro" });
      const redirectUrl = res.data?.redirectUrl;
      if (!redirectUrl) throw new Error("No checkout URL");
      window.location.href = redirectUrl;
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not start checkout");
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6, ease: "easeInOut" } }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />

      <button
        onClick={() => navigate("/chat")}
        className="fixed top-5 left-5 z-30 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50 text-slate-200 hover:bg-slate-700/70 transition-colors"
        title="Back"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center">
        <span className="bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent">
          Billing
        </span>
      </h1>
      <p className="text-slate-400 mt-3 text-center">Upgrade to Pro</p>

      <div className="mt-10 w-full max-w-md bg-slate-900/70 backdrop-blur-xl border border-emerald-700/40 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Pro Plan</h3>
            <p className="text-slate-400 text-sm">$1 / month</p>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5 text-slate-200 text-sm">
          <li>• 2 AI's</li>
          <li>• 100 AI code credits</li>
          <li>• ∞ normal AI credits</li>
        </ul>

        {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

        <button
          onClick={startCheckout}
          disabled={loading}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Subscribe — $1/mo"}
        </button>
        <p className="mt-3 text-center text-xs text-slate-500">Secure checkout via Base44 Payments</p>
      </div>
    </motion.div>
  );
}