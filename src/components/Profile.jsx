import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Mail, Shield, KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Profile({ open, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password change flow: idle -> code -> newpw
  const [pwStep, setPwStep] = useState("idle");
  const [pwBusy, setPwBusy] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [reenter, setReenter] = useState("");
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
    setCode("");
    setNewPassword("");
    setReenter("");
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
      setPwStep("code");
    } catch (e) {
      setPwError(e.message || "Could not send reset email");
    } finally {
      setPwBusy(false);
    }
  };

  const submitCode = () => {
    setPwError("");
    if (!code.trim()) {
      setPwError("Enter the code from your email");
      return;
    }
    setPwStep("newpw");
  };

  const confirmReset = async () => {
    setPwError("");
    if (!newPassword) {
      setPwError("Enter a new password");
      return;
    }
    if (newPassword !== reenter) {
      setPwError("Passwords do not match");
      return;
    }
    setPwBusy(true);
    try {
      await base44.auth.resetPassword({ resetToken: code.trim(), newPassword });
      resetPwState();
    } catch (e) {
      setPwError(e.message || "Could not reset password");
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

  const inputCls =
    "w-full h-11 px-3 rounded-xl bg-slate-800/70 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/60 text-sm";

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

                {pwError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm text-center">
                    {pwError}
                  </div>
                )}

                {pwStep === "code" ? (
                  <>
                    <p className="text-slate-300 text-sm mb-1 font-medium">Enter the code from your email</p>
                    <p className="text-slate-500 text-xs mb-4">
                      We sent a code to {user?.email}. Enter it below to continue.
                    </p>
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Code"
                      className={inputCls}
                    />
                    <button
                      onClick={submitCode}
                      className="mt-4 w-full h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Continue
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-slate-300 text-sm mb-4 font-medium">Enter new password</p>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className={inputCls}
                    />
                    <input
                      type="password"
                      value={reenter}
                      onChange={(e) => setReenter(e.target.value)}
                      placeholder="Re-enter new password"
                      className={inputCls + " mt-3"}
                    />
                    <button
                      onClick={confirmReset}
                      disabled={pwBusy}
                      className="mt-4 w-full h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {pwBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</> : "Confirm"}
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}