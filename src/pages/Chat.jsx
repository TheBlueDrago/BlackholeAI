import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import ChatBox from "@/components/ChatBox";
import CodePage from "@/components/CodePage";
import Sidebar from "@/components/Sidebar";
import Subscriptions from "@/components/Subscriptions";
import Profile from "@/components/Profile";
import PromoExpiredPopup from "@/components/PromoExpiredPopup";
import TeamWelcomePopup from "@/components/TeamWelcomePopup";
import Monitor from "@/pages/Monitor";
import PromoManager from "@/pages/PromoManager";
import WebsiteDesigner from "@/components/WebsiteDesigner";
import ThemeToggle from "@/components/ThemeToggle";
import BanScreen from "@/components/BanScreen";
import MobileTabBar from "@/components/MobileTabBar";
import { useConversations } from "@/hooks/useConversations";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate } from "react-router-dom";

export default function Chat() {
  const [mode, setMode] = useState(() => {
    try {
      const t = new URLSearchParams(window.location.search).get("tab");
      if (t === "code" || t === "designer") return t;
    } catch {}
    return "ai";
  }); // "ai" | "code" | "subscriptions"
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileInitialView, setProfileInitialView] = useState("main");
  const [returnMode, setReturnMode] = useState("ai");
  const conv = useConversations();
  const navigate = useNavigate();
  const credits = useCredits();
  const [currentUser, setCurrentUser] = useState(null);
  const [lightMode, setLightMode] = useState(false);

  // Record this account's email so re-registration after deletion can be blocked.
  useEffect(() => {
    base44.functions.invoke("record-email").catch(() => {});
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  // Light/dark theme is stored per account, so one user's choice never affects anyone else.
  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      setLightMode(localStorage.getItem("infinity-ai-light-" + currentUser.id) === "1");
    } catch {}
  }, [currentUser?.id]);

  // Reflect the active tab in the URL (?tab=) so it stays shareable without a router navigation.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (mode === "ai") url.searchParams.delete("tab");
      else url.searchParams.set("tab", mode);
      window.history.replaceState({}, "", url);
    } catch {}
  }, [mode]);

  const toggleLight = () => {
    setLightMode((prev) => {
      const next = !prev;
      if (currentUser?.id) {
        try {
          localStorage.setItem("infinity-ai-light-" + currentUser.id, next ? "1" : "0");
        } catch {}
      }
      return next;
    });
  };

  const isAdmin = currentUser?.role === "admin";
  const isBanned = currentUser?.banned === true;
  const blockedUntil = currentUser?.blockedUntil ? new Date(currentUser.blockedUntil) : null;
  const isBlocked = blockedUntil && blockedUntil > new Date();
  const planActive = currentUser?.plan && currentUser.plan !== "free" && (!currentUser?.planExpiresAt || new Date(currentUser.planExpiresAt) > new Date());
  const effPlan = planActive ? currentUser.plan : "free";
  const avatarInitial = (currentUser?.full_name || currentUser?.email || "U").trim().charAt(0).toUpperCase();
  const applyLight = lightMode && (mode === "ai" || mode === "code" || mode === "designer");

  const switchMode = (m) => { setMode(m); setSidebarOpen(false); };
  const goHome = () => switchMode("ai");
  const goCode = () => switchMode("code");
  const newChat = () => {
    conv.createConversation("New Chat");
    switchMode("ai");
  };
  const goSubscriptions = () => { setReturnMode(mode === "designer" ? "designer" : "ai"); setMode("subscriptions"); setSidebarOpen(false); };
  const goDesigner = () => switchMode("designer");
  const finishSubscriptions = () => { setMode(returnMode); setSidebarOpen(false); };
  const goBilling = (productId = "pro") => navigate("/billing", { state: { productId } });

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden relative ${applyLight ? "light-mode" : ""}`}>
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />

      {isBanned || isBlocked ? (
        <BanScreen banned={isBanned} until={blockedUntil} />
      ) : mode === "subscriptions" ? (
        <Subscriptions onFree={finishSubscriptions} onPro={() => goBilling("pro")} onTeam={() => goBilling("team")} onSecret={() => goBilling("secret")} />
      ) : mode === "monitor" ? (
        <Monitor onBack={() => setMode("ai")} />
      ) : mode === "promos" ? (
        <PromoManager onBack={() => setMode("ai")} />
      ) : mode === "designer" ? (
        <div className="relative z-10 h-screen pb-14 sm:pb-0">
          <AnimatePresence>
            {sidebarOpen && (
              <div className="absolute top-20 left-4 z-40">
                <Sidebar
                  conversations={conv.conversations}
                  activeId={conv.activeId}
                  onSelect={(id) => { conv.selectConversation(id); switchMode("ai"); }}
                  onRename={conv.renameConversation}
                  onDelete={conv.deleteConversation}
                  onGoHome={goHome}
                  onGoCode={goCode}
                  onNewChat={newChat}
                  onGoSubscriptions={goSubscriptions}
                  onGoDesigner={goDesigner}
                  onGoMonitor={() => switchMode("monitor")}
                  isAdmin={isAdmin}
                  credits={{ aiTotal: credits.aiTotal, aiUsed: credits.aiUsed, aiCodeTotal: credits.aiCodeTotal, aiCodeUsed: credits.aiCodeUsed, galaxy5Total: credits.galaxy5Total, galaxy5Used: credits.galaxy5Used, space5Total: credits.space5Total, space5Used: credits.space5Used }}
                />
              </div>
            )}
          </AnimatePresence>
          <WebsiteDesigner
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
            onOpenProfile={() => { setProfileInitialView("main"); setProfileOpen(true); }}
            onUpgrade={() => { setReturnMode("designer"); setMode("subscriptions"); }}
            lightMode={lightMode}
            onToggleLight={toggleLight}
            plan={effPlan}
            aiExhausted={credits.aiExhausted}
            aiCodeExhausted={credits.aiCodeExhausted}
            onSpendAI={credits.spendAI}
            onSpendAICode={credits.spendAICode}
            galaxy5Exhausted={credits.galaxy5Exhausted}
            onSpendGalaxy5={credits.spendGalaxy5}
            space5Exhausted={credits.space5Exhausted}
            onSpendSpace5={credits.spendSpace5}
          />
        </div>
      ) : (
        <motion.div
          className="relative z-10 min-h-screen flex flex-col items-center justify-center pt-4 sm:pt-10 pb-24 sm:pb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 sm:top-5 sm:left-5 z-30 p-2 sm:p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50 text-slate-200 hover:bg-slate-700/70 transition-colors"
            title="Menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="fixed top-[max(1rem,env(safe-area-inset-top))] right-4 sm:top-5 sm:right-5 z-30 flex items-center gap-2">
            <ThemeToggle light={lightMode} onToggle={toggleLight} />
            <span className="h-8 w-px bg-slate-500/60" />
            <button
              onClick={() => {
                setProfileInitialView("main");
                setProfileOpen(true);
              }}
              className="keep-color w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
              title="Profile"
            >
              {avatarInitial}
            </button>
          </div>

          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                className="sm:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-5 w-full min-h-[60vh] sm:min-h-[524px]">
            <AnimatePresence>
              {sidebarOpen && (
                <Sidebar
                  conversations={conv.conversations}
                  activeId={conv.activeId}
                  onSelect={conv.selectConversation}
                  onRename={conv.renameConversation}
                  onDelete={conv.deleteConversation}
                  onGoHome={goHome}
                  onGoCode={goCode}
                  onNewChat={newChat}
                  onGoSubscriptions={goSubscriptions}
                  onGoDesigner={goDesigner}
                  onGoMonitor={() => switchMode("monitor")}
                  isAdmin={isAdmin}
                  credits={{ aiTotal: credits.aiTotal, aiUsed: credits.aiUsed, aiCodeTotal: credits.aiCodeTotal, aiCodeUsed: credits.aiCodeUsed, galaxy5Total: credits.galaxy5Total, galaxy5Used: credits.galaxy5Used, space5Total: credits.space5Total, space5Used: credits.space5Used }}
                />
              )}
            </AnimatePresence>
            {mode === "ai" ? (
              <ChatBox
                conversation={conv.activeConversation}
                createConversation={conv.createConversation}
                addMessage={conv.addMessage}
                renameConversation={conv.renameConversation}
                plan={effPlan}
                aiExhausted={credits.aiExhausted}
                aiCodeExhausted={credits.aiCodeExhausted}
                onSpendAI={credits.spendAI}
                onSpendAICode={credits.spendAICode}
                userInitial={avatarInitial}
              />
            ) : (
              <CodePage aiCodeExhausted={credits.aiCodeExhausted} onSpendAICode={credits.spendAICode} userInitial={avatarInitial} />
            )}
          </div>

        </motion.div>
      )}
      <Profile
        open={profileOpen}
        initialView={profileInitialView}
        onClose={() => {
          setProfileOpen(false);
          setProfileInitialView("main");
        }}
        onMonitor={() => {
          setProfileOpen(false);
          switchMode("monitor");
        }}
        onPromos={() => {
          setProfileOpen(false);
          switchMode("promos");
        }}
      />
      <TeamWelcomePopup
        onAddPeople={() => {
          setProfileInitialView("membership");
          setProfileOpen(true);
        }}
      />
      <PromoExpiredPopup />
      {!isBanned && !isBlocked && (mode === "ai" || mode === "code" || mode === "designer") && (
        <MobileTabBar
          active={mode}
          onChat={goHome}
          onCode={goCode}
          onDesigner={goDesigner}
          onSettings={() => { setProfileInitialView("main"); setProfileOpen(true); }}
          profileOpen={profileOpen}
        />
      )}
    </div>
  );
}