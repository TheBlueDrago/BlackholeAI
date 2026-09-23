import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useConversations } from "@/hooks/useConversations";
import { useCredits } from "@/hooks/useCredits";
import { claimPendingReferral } from "@/lib/referral";
import { applyThemeClass, readUserTheme, writeUserTheme, prefersLight } from "@/lib/theme";

const AppShellContext = createContext(null);

export const useAppShell = () => useContext(AppShellContext);

export function AppShellProvider({ children }) {
  const navigate = useNavigate();
  const conv = useConversations();
  const credits = useCredits();
  const [currentUser, setCurrentUser] = useState(null);
  const [lightMode, setLightMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    base44.functions.invoke("record-email").catch(() => {});
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  // A new user who arrived through a friend's invite link: count the referral once.
  useEffect(() => {
    if (currentUser?.id) claimPendingReferral();
  }, [currentUser?.id]);

  // Initial theme from OS preference, then refined per-user once we know who's logged in.
  useEffect(() => {
    setLightMode(prefersLight());
  }, []);
  useEffect(() => {
    if (!currentUser?.id) return;
    const t = readUserTheme(currentUser.id);
    if (t !== null) setLightMode(t);
  }, [currentUser?.id]);
  useEffect(() => {
    applyThemeClass(lightMode);
  }, [lightMode]);

  const toggleLight = useCallback(() => {
    setLightMode((prev) => {
      const next = !prev;
      writeUserTheme(currentUser?.id, next);
      return next;
    });
  }, [currentUser?.id]);

  const isAdmin = currentUser?.role === "admin";
  const isBanned = currentUser?.banned === true;
  const blockedUntil = currentUser?.blockedUntil ? new Date(currentUser.blockedUntil) : null;
  const isBlocked = !!(blockedUntil && blockedUntil > new Date());
  // Single source of truth for the effective plan (handles admin, secret, team membership and Pro expiry).
  const effPlan = credits.plan;
  const avatarInitial = (currentUser?.full_name || currentUser?.email || "U").trim().charAt(0).toUpperCase();

  const goHome = useCallback(() => { navigate("/chat"); setSidebarOpen(false); }, [navigate]);
  const goCode = useCallback(() => {
    // Access follows credits: anyone with Blackhole Code credits (plan, referrals, admin) can use it.
    if (credits.aiCodeRemaining > 0) { navigate("/chat/code"); } else { navigate("/chat/plans"); }
    setSidebarOpen(false);
  }, [navigate, credits.aiCodeRemaining]);
  const goDesigner = useCallback(() => { navigate("/chat/designer"); setSidebarOpen(false); }, [navigate]);
  const goBrowser = useCallback(() => { navigate("/chat/browser"); setSidebarOpen(false); }, [navigate]);
  const goGames = useCallback(() => { navigate("/chat/games"); setSidebarOpen(false); }, [navigate]);
  const goGameDesigner = useCallback(() => { navigate("/chat/game-designer", { state: { fresh: Date.now() } }); setSidebarOpen(false); }, [navigate]);
  const goPlans = useCallback(() => { navigate("/chat/plans"); setSidebarOpen(false); }, [navigate]);
  const goMonitor = useCallback(() => { navigate("/chat/monitor"); setSidebarOpen(false); }, [navigate]);
  const goPromos = useCallback(() => { navigate("/chat/promos"); setSidebarOpen(false); }, [navigate]);
  const newChat = useCallback(() => { conv.createConversation("New Chat"); navigate("/chat"); setSidebarOpen(false); }, [navigate, conv]);
  const goBilling = useCallback((productId = "pro") => navigate("/billing", { state: { productId } }), [navigate]);
  const openProfile = useCallback((initialView = "main") => navigate("/chat/settings", { state: { initialView } }), [navigate]);

  const value = {
    currentUser, conv, credits, lightMode, toggleLight,
    isAdmin, isBanned, isBlocked, blockedUntil, effPlan, avatarInitial,
    sidebarOpen, setSidebarOpen,
    navigate, goHome, goCode, goDesigner, goBrowser, goGames, goGameDesigner, goPlans, goMonitor, goPromos, newChat, goBilling, openProfile,
  };

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}