import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Mail, Shield, KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Profile({ open, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password reset flow: idle -> sent
  const [pwStep, setPwStep] = useState("idle");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (open) {
      setLoading(true);
      base44.auth.me()
        .then((u) => setUser(u))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const resetPwState = () => {
    setPwStep("idle");
    setPwError("");
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const startReset = async () => {
    setPwError("");
    setPwBusy(true);
    try {
      await base44.auth.resetPasswordRequest(user?.email || "");
      setPwStep("sent");
    } catch (e) {
      setPwError(e.message || "Could not send reset email");
    } finally {
      setPwBusy(false);
    }
  };

  const initials = (user?.full_name || user?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
          >
            {pwStep === "idle" ? (
              <>
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
                    {loading ? "?" : initials}
                  </div>
                  {loading ? (
                    <div className="mt-4 w-32 h-4 rounded bg-slate-700/50 animate-pulse" />
                  ) : user ? (
                    <>
                      <h3 className="mt-4 text-lg font-semibold text-white">
                        {user.full_name || "Infinity User"}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-slate-400 text-sm">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{user.email}</span>
                      </div>
                      {user.role && (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          <Shield className="w-3 h-3" />
                          {user.role}
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="mt-4 text-slate-400 text-sm">Not signed in</p>
                  )}
                </div>

                <div className="h-px bg-slate-700/50" />

                <div className="p-4 space-y-2.5">
                  <button
                    onClick={startReset}
                    disabled={pwBusy || !user}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-medium hover:bg-slate-700 transition-colors disabled:opacity-60"
                  >
                    {pwBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    Forgot password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/90 text-white font-medium hover:bg-red-500 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <div className="p-6">
                <button
                  onClick={resetPwState}
                  className="flex items-center gap-1.5 text-slate-400 text-sm hover:text-slate-200 transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-slate-200 text-base font-semibold">Look at your AI account email for the password reset link</p>
                  <p className="text-slate-500 text-xs mt-2">We sent a reset link to {user?.email}.</p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}