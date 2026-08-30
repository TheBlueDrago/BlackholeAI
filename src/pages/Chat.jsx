import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppShellProvider, useAppShell } from "@/components/AppShellContext";
import Profile from "@/components/Profile";
import PromoExpiredPopup from "@/components/PromoExpiredPopup";
import TeamWelcomePopup from "@/components/TeamWelcomePopup";
import BanScreen from "@/components/BanScreen";
import MobileTabBar from "@/components/MobileTabBar";

function ChatLayout() {
  const shell = useAppShell();
  const { isBanned, isBlocked, blockedUntil, openProfile } = shell;
  const loc = useLocation();
  const navigate = useNavigate();

  const profileOpen = loc.pathname.startsWith("/chat/settings");
  const profileInitialView = loc.state?.initialView || "main";
  const showTabbar = ["/chat", "/chat/code", "/chat/designer"].includes(loc.pathname) && !isBanned && !isBlocked;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />

      {isBanned || isBlocked ? <BanScreen banned={isBanned} until={blockedUntil} /> : <Outlet />}

      <Profile
        open={profileOpen}
        initialView={profileInitialView}
        onClose={() => navigate(-1)}
        onMonitor={() => navigate("/chat/monitor", { replace: true })}
        onPromos={() => navigate("/chat/promos", { replace: true })}
      />
      <TeamWelcomePopup onAddPeople={() => openProfile("membership")} />
      <PromoExpiredPopup />
      {showTabbar && (
        <MobileTabBar
          active={loc.pathname}
          onChat={shell.goHome}
          onCode={shell.goCode}
          onDesigner={shell.goDesigner}
          onSettings={() => openProfile("main")}
          profileOpen={profileOpen}
        />
      )}
    </div>
  );
}

export default function Chat() {
  return (
    <AppShellProvider>
      <ChatLayout />
    </AppShellProvider>
  );
}