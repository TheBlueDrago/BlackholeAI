import { useEffect, useState } from "react";

// "Install app": Chrome/Edge/Android fire beforeinstallprompt once, early, so it's caught
// here at startup (imported from main.jsx) and kept until someone taps Install.
let deferred = null;
const listeners = new Set();
const notify = () => listeners.forEach((f) => f());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    deferred = e;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

const standalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

// iPhone/iPad Safari has no install prompt; people add it from the Share menu instead.
const iosBrowser = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

// -> { canPrompt, ios, install } (both false when already installed)
export function useInstallApp() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const f = () => rerender((n) => n + 1);
    listeners.add(f);
    return () => listeners.delete(f);
  }, []);
  const installed = standalone();
  return {
    canPrompt: !installed && !!deferred,
    ios: !installed && !deferred && iosBrowser(),
    install: async () => {
      if (!deferred) return;
      const e = deferred;
      deferred = null;
      notify();
      await e.prompt();
    },
  };
}
