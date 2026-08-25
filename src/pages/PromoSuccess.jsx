import React from "react";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function PromoSuccess() {
  const location = useLocation();
  const expiresAt = location.state?.expiresAt;
  const expiryText = expiresAt
    ? new Date(expiresAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "in one month";

  return (
    <motion.div
      className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6, ease: "easeInOut" } }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/30">
        <Gift className="w-9 h-9 text-white" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-white text-center">You've unlocked Pro!</h1>
      <p className="text-slate-300 mt-3 text-center max-w-md">
        Enjoy the Pro plan free for one month — active until {expiryText}.
      </p>
      <Link
        to="/chat"
        className="mt-8 inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-opacity"
      >
        Start using Pro
      </Link>
    </motion.div>
  );
}