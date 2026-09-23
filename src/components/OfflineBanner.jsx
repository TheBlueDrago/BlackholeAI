import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

// A small notice while the device is offline: the AI, publishing and saving all need
// a connection, and without this they just fail with generic errors.
export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="keep-color fixed top-2 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-black text-xs font-medium shadow-lg whitespace-nowrap" title="The AI, publishing and saving need a connection.">
      <WifiOff className="w-3.5 h-3.5 shrink-0" /> You're offline
    </div>
  );
}
