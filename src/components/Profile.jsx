import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Mail, Shield, KeyRound, ArrowLeft, Loader2, Crown, Settings, Users, Lock, ShieldCheck, Ticket, Trash2, Gamepad2, Pencil, Eye, EyeOff, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TeamMembership from "@/components/TeamMembership";
import PublishedSites from "@/components/profile/PublishedSites";

export default function Profile({ open, onClose, initialView = "main", onMonitor, onPromos }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("main"); // main | settings | membership | games
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesErr, setGamesErr] = useState("");

  // Password reset flow: idle -> sent
  const [pwStep, setPwStep] = useState("idle");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");

  // Account deletion confirmation
  const [delText, setDelText] = useState("");
  const [delAck, setDelAck] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState("");

  useEffect(() => {
    if (open) {
      setLoading(true);
      setView(initialView);
      setPwStep("idle");
      setPwError("");
      setDelText("");
      setDelAck(false);
      setDelError("");
      base44.auth
        .me()
        .then((u) => setUser(u))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    }
  }, [open, initialView]);

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

  const handleDeleteAccount = async () => {
    setDelError("");
    setDelBusy(true);
    try {
      await base44.functions.invoke("delete-account");
      base44.auth.logout();
    } catch (e) {
      setDelError(e?.response?.data?.error || e?.message || "Could not delete account");
      setDelBusy(false);
    }
  };

  const loadGames = async () => {
    setGamesLoading(true);
    setGamesErr("");
    try {
      const list = await base44.entities.PublishedGame.list("-updated_date", 200);
      setGames((list || []).filter((g) => user?.role === "admin" || g.created_by_id === user?.id));
    } catch (e) {
      setGamesErr(e?.message || "Could not load games");
    } finally {
      setGamesLoading(false);
    }
  };
  const editGame = async (g) => {
    setGamesErr("");
    try {
      const res = await base44.functions.invoke("get-game-html", { name: g.name });
      const d = res.data || {};
      const html = d.html || "";
      localStorage.setItem("infinity-ai-game-designer", JSON.stringify({
        gameName: g.name,
        title: d.title || g.title || "",
        genre: d.genre || g.genre || "io",
        messages: html ? [{ role: "ai", content: html }] : [],
        projectId: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now())
      }));
      navigate("/chat/game-designer", { replace: true });
    } catch (e) {
      setGamesErr(e?.message || "Could not open game");
    }
  };
  const toggleHidden = async (g) => {
    try {
      await base44.entities.PublishedGame.update(g.id, { hidden: !g.hidden });
      loadGames();
    } catch (e) {
      setGamesErr(e?.message);
    }
  };
  const deleteGame = async (g) => {
    if (!window.confirm(`Delete "${g.title || g.name}"? This cannot be undone.`)) return;
    try {
      await base44.entities.PublishedGame.delete(g.id);
      loadGames();
    } catch (e) {
      setGamesErr(e?.message);
    }
  };
  const [deletingAll, setDeletingAll] = useState(false);
  const deleteAllGames = async () => {
    if (!games.length) return;
    if (!window.confirm(`Delete all ${games.length} game${games.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setDeletingAll(true);
    setGamesErr("");
    try {
      for (const g of games) {
        await base44.entities.PublishedGame.delete(g.id);
      }
      await loadGames();
    } catch (e) {
      setGamesErr(e?.message || "Could not delete all games");
    } finally {
      setDeletingAll(false);
    }
  };

  const initials = (user?.full_name || user?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isPro = user?.plan === "pro" && (!user?.planExpiresAt || new Date(user.planExpiresAt) > new Date());
  const isTeam = user?.plan === "team" && (!user?.planExpiresAt || new Date(user.planExpiresAt) > new Date());
  const isSecret = user?.role === "admin" || (user?.plan === "secret" && (!user?.planExpiresAt || new Date(user.planExpiresAt) > new Date()));
  const effPlan = isSecret ? "secret" : isTeam ? "team" : isPro ? "pro" : "free";

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
            {pwStep === "sent" ? (
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
                  <p className="text-slate-200 text-base font-semibold">
                    Look at your AI account email for the password reset link
                  </p>
                  <p className="text-slate-500 text-xs mt-2">We sent a reset link to {user?.email}.</p>
                </div>
              </div>
            ) : view === "membership" ? (
              <TeamMembership onBack={() => setView("settings")} />
            ) : view === "delete" ? (
              <div className="p-6">
                <button
                  onClick={() => setView("settings")}
                  className="flex items-center gap-1.5 text-slate-400 text-sm hover:text-slate-200 transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex items-center gap-2 mb-3">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-white">Delete Account</h3>
                </div>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                  This permanently deletes your account and all associated data. This action cannot be undone.
                </p>
                <label className="text-xs text-slate-400">
                  Type <span className="font-semibold text-red-400">DELETE</span> to confirm
                </label>
                <input
                  value={delText}
                  onChange={(e) => setDelText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full mt-1 mb-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-red-500 transition-colors uppercase tracking-wide"
                />
                <label className="flex items-start gap-2 text-xs text-slate-300 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={delAck}
                    onChange={(e) => setDelAck(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 accent-red-500 shrink-0"
                  />
                  <span>I understand this is permanent and cannot be undone.</span>
                </label>
                {delError && <p className="text-sm text-red-400 mb-2">{delError}</p>}
                <button
                  onClick={handleDeleteAccount}
                  disabled={delBusy || !delAck || delText !== "DELETE"}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {delBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete account
                </button>
              </div>
            ) : view === "sites" ? (
              <PublishedSites user={user} plan={effPlan} onBack={() => setView("settings")} />
            ) : view === "games" ? (
              <div className="p-6">
                <button
                  onClick={() => setView("settings")}
                  className="flex items-center gap-1.5 text-slate-400 text-sm hover:text-slate-200 transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-fuchsia-300" />
                    <h3 className="text-lg font-semibold text-white">Published Games</h3>
                  </div>
                  {games.length > 0 && (
                    <button
                      onClick={deleteAllGames}
                      disabled={deletingAll}
                      className="flex items-center gap-1 text-xs text-red-300 hover:text-red-200 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {deletingAll ? "Deleting…" : "Delete all"}
                    </button>
                  )}
                </div>
                {gamesLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
                ) : games.length === 0 ? (
                  <p className="text-slate-500 text-sm py-6 text-center">You haven't published any games yet.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto sidebar-scroll pr-1">
                    {games.map((g) => (
                      <div key={g.id} className="rounded-xl bg-slate-800 border border-slate-700/50 p-3">
                        <p className="text-sm font-medium text-slate-100 truncate">{g.title || g.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{g.name} · {g.plays || 0} plays{g.hidden ? " · hidden" : ""}{g.featured ? " · featured" : ""}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <button onClick={() => editGame(g)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-xs hover:bg-slate-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => toggleHidden(g)} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors ${g.hidden ? "bg-emerald-600/80 text-white hover:bg-emerald-500" : "bg-slate-700 text-slate-200 hover:bg-slate-600"}`}>
                            {g.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            {g.hidden ? "Republish" : "Unpublish"}
                          </button>
                          <button onClick={() => deleteGame(g)} className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-red-900/50 text-red-300 text-xs hover:bg-red-900/70 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {gamesErr && <p className="text-sm text-red-400 mt-3">{gamesErr}</p>}
              </div>
            ) : view === "settings" ? (
              <div className="p-6">
                <button
                  onClick={() => setView("main")}
                  className="flex items-center gap-1.5 text-slate-400 text-sm hover:text-slate-200 transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-slate-300" />
                  <h3 className="text-lg font-semibold text-white">Settings</h3>
                </div>
                <button
                  onClick={() => setView("membership")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Users className="w-4 h-4 text-sky-300" />
                    Membership
                  </span>
                  <ArrowLeft className="w-4 h-4 rotate-180 text-slate-500" />
                </button>
                <button
                  onClick={() => { setView("games"); loadGames(); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Gamepad2 className="w-4 h-4 text-fuchsia-300" />
                    Published Games
                  </span>
                  <ArrowLeft className="w-4 h-4 rotate-180 text-slate-500" />
                </button>
                <button
                  onClick={() => setView("sites")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Globe className="w-4 h-4 text-sky-300" />
                    Published Websites
                  </span>
                  <ArrowLeft className="w-4 h-4 rotate-180 text-slate-500" />
                </button>
                  <button
                  onClick={() => setView("delete")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-900/40 text-red-300 hover:bg-red-900/60 transition-colors border border-red-800/50"
                  >
                  <span className="flex items-center gap-2 font-medium">
                    <Trash2 className="w-4 h-4" />
                    Delete account
                  </span>
                  <ArrowLeft className="w-4 h-4 rotate-180 text-red-500" />
                  </button>
                  </div>
            ) : (
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
                        {user.full_name || "Blackhole User"}
                      </h3>
                      {isSecret ? (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-black text-slate-100 border border-slate-700">
                          <Lock className="w-3 h-3" />
                          Secret
                        </span>
                      ) : isTeam ? (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-sky-500/25 to-indigo-500/25 text-sky-200 border border-sky-400/50">
                          <Users className="w-3 h-3" />
                          Team
                        </span>
                      ) : isPro ? (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-200 border border-amber-400/50">
                          <Crown className="w-3 h-3" />
                          Pro
                        </span>
                      ) : null}
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
                  {user?.role === "admin" && (
                    <button
                      onClick={onMonitor}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-medium hover:bg-slate-700 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Monitor
                    </button>
                  )}
                  {user?.role === "admin" && (
                    <button
                      onClick={onPromos}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-medium hover:bg-slate-700 transition-colors"
                    >
                      <Ticket className="w-4 h-4" />
                      Promo Code
                    </button>
                  )}
                  <button
                    onClick={startReset}
                    disabled={pwBusy || !user}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-medium hover:bg-slate-700 transition-colors disabled:opacity-60"
                  >
                    {pwBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    Forgot password
                  </button>
                  <button
                    onClick={() => setView("settings")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-medium hover:bg-slate-700 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
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
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}