import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import RewardPicker, { REWARD_LABEL } from "@/components/profile/RewardPicker";
import { clearWelcomePending } from "@/lib/referral";

// Shown once to a new user who joined through a friend's invite link: they pick their
// own welcome bonus (the friend picks one too — see ReferFriends).
export default function WelcomeReward({ open, onClose, onClaimed }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    base44.functions
      .invoke("referrals", { action: "get" })
      .then((r) => {
        const w = r.data?.welcome;
        if (!w || w.reward || w.revoked) {
          clearWelcomePending();
          onClose();
        } else setData(r.data);
      })
      .catch(() => onClose());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pick = async (tier) => {
    setBusy(true);
    setError("");
    try {
      const r = await base44.functions.invoke("referrals", { action: "claim-welcome", tier });
      clearWelcomePending();
      setDone(r.data.welcome.reward);
      onClaimed?.(r.data.credits);
    } catch (e) {
      setError(e?.response?.data?.error || "Couldn't add your bonus. Try again from Account → Refer friends.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-sm bg-slate-900 border border-amber-400/40 rounded-2xl p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-300" />
                <h3 className="text-lg font-semibold text-white">Welcome to Blackhole AI!</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-white/10" title="Later">
                <X className="w-4 h-4" />
              </button>
            </div>
            {done ? (
              <p className="text-sm text-emerald-300 mt-3">
                ✓ {done.amount} {REWARD_LABEL[done.tier]} credits added. Have fun building!
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-300 mt-2 mb-4">
                  A friend invited you, so you both get free credits. Pick your welcome bonus — it works even without a plan:
                </p>
                <RewardPicker rewards={data.rewards} onPick={pick} disabled={busy} />
                {busy && <Loader2 className="w-4 h-4 animate-spin text-slate-400 mx-auto mt-3" />}
              </>
            )}
            {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
            {done && (
              <button onClick={onClose} className="mt-4 w-full py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-400">
                Start building
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
