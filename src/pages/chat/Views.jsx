import React from "react";
import { useAppShell } from "@/components/AppShellContext";
import Subscriptions from "@/components/Subscriptions";
import Monitor from "@/pages/Monitor";
import PromoManager from "@/pages/PromoManager";

// Thin route components so the secondary views live on real URLs and support swipe-back.
export function PlansView() {
  const shell = useAppShell();
  return (
    <Subscriptions
      onFree={() => shell.navigate(-1)}
      onPro={() => shell.goBilling("pro")}
      onTeam={() => shell.goBilling("team")}
      onSecret={() => shell.goBilling("secret")}
    />
  );
}

export function MonitorView() {
  const shell = useAppShell();
  return <Monitor onBack={() => shell.navigate(-1)} />;
}

export function PromosView() {
  const shell = useAppShell();
  return <PromoManager onBack={() => shell.navigate(-1)} />;
}

// The Settings route just signals the Profile modal (rendered by the ChatLayout) to open.
export function SettingsView() {
  return null;
}