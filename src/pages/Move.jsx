import React, { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { OLD_ORIGIN, applyMove } from "@/lib/domainMove";

// nebuluxai.com/move: receives chats, drafts and settings from the old address (lib/domainMove.js).
// Only a tab opened by the old address, and only messages from exactly that address, count.
export default function Move() {
  const [state, setState] = useState(window.opener ? "waiting" : "none");

  useEffect(() => {
    const opener = window.opener;
    if (!opener) return undefined;
    const onMsg = (e) => {
      if (e.origin !== OLD_ORIGIN || e.source !== opener || !e.data || e.data.type !== "bh-move") return;
      applyMove(e.data.data);
      setState("done");
      opener.postMessage({ type: "bh-move-done" }, OLD_ORIGIN);
      // The old tab goes on to nebuluxai.com itself; this one isn't needed any more.
      setTimeout(() => {
        window.close();
        window.location.replace("/chat");
      }, 400);
    };
    window.addEventListener("message", onMsg);
    opener.postMessage({ type: "bh-move-ready" }, OLD_ORIGIN);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-950 text-slate-200 p-6 text-center">
      {state === "done" ? <Check className="w-8 h-8 text-emerald-400" /> : state === "waiting" ? <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /> : null}
      <p className="text-lg font-semibold">{state === "done" ? "All moved!" : state === "waiting" ? "Moving your chats…" : "Nothing to move here"}</p>
      {state === "none" && (
        <a href="/chat" className="text-sm text-indigo-300 underline">
          Go to Nebulux AI
        </a>
      )}
    </div>
  );
}
