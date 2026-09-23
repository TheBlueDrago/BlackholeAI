import React from "react";
import { Navigate } from "react-router-dom";
import { useAppShell } from "@/components/AppShellContext";
import Subscriptions from "@/components/Subscriptions";
import Monitor from "@/pages/Monitor";
import PromoManager from "@/pages/PromoManager";

// Thin route components so the secondary views live on real URLs and support swipe-back.
export function PlansView() {
  const shell = useAppShell();
  return (
    <Subscriptions
      onFree={shell.goBack}
      onPro={() => shell.goBilling("pro")}
      onTeam={() => shell.goBilling("team")}
      onSecret={() => shell.goBilling("secret")}
    />
  );
}

export function MonitorView() {
  const shell = useAppShell();
  return <Monitor onBack={shell.goBack} />;
}

export function PromosView() {
  const shell = useAppShell();
  return <PromoManager onBack={shell.goBack} />;
}

// Old /chat/settings links: open the profile over the chat.
export function SettingsView() {
  return <Navigate to="/chat" replace state={{ profile: "main" }} />;
}