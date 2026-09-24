import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import useEscape from "@/hooks/useEscape";

// Shows once when a promo-granted plan (pro or team) has passed its expiry, so the user
// knows their free promo ended and can close it out without being charged.
export default function PromoExpiredPopup() {
  const [show, setShow] = useState(false);

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    base44.auth
      .me()
      .then((u) => {
        const expired =
          u &&
          (u.plan === "pro" || u.plan === "team") &&
          u.planExpiresAt &&
          new Date(u.planExpiresAt) < new Date();
        if (expired) setShow(true);
      })
      .catch(() => {});
  }, []);

  const close = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke("expire-promo");
    } catch {}
    setShow(false);
    setBusy(false);
  };
  useEscape(show && !busy, close);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Your promo membership expired"
            className="w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain max-w-sm bg-slate-900 border border-slate-700/60 rounded-2xl p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-300" />
            </div>
            <h3 className="text-lg font-semibold text-white">Your Promo Code Membership expired</h3>
            <p className="text-slate-400 text-sm mt-2">
              Your free promo membership has ended. You won't be charged — close to go back to the Free plan.
            </p>
            <button
              onClick={close}
              disabled={busy}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              {busy ? "Closing…" : "Close"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}