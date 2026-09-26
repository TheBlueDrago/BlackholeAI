import React, { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { OLD_ORIGIN, NEW_ORIGIN, MOVED_KEY, isOldAddress, collectForMove } from "@/lib/domainMove";

// On the old address only: a bar that moves everything to nebuluxai.com in one tap (lib/domainMove.js).
// Moving needs a tap (it opens a new tab), and the data only ever goes to NEW_ORIGIN.
export default function DomainMove() {
  const [state, setState] = useState("idle"); // idle | moving | failed
  const old = isOldAddress();

  useEffect(() => {
    if (!old) return undefined;
    let moved = false;
    try {
      moved = localStorage.getItem(MOVED_KEY) === "1";
    } catch {
      // Storage blocked.
    }
    // Already moved: this address just sends people on.
    if (moved) window.location.replace(NEW_ORIGIN + window.location.pathname + window.location.search);
    return undefined;
  }, [old]);

  if (!old) return null;

  const move = () => {
    setState("moving");
    const tab = window.open(`${NEW_ORIGIN}/move`, "_blank");
    if (!tab) {
      setState("failed");
      return;
    }
    const timer = setTimeout(() => {
      window.removeEventListener("message", onMsg);
      setState("failed");
    }, 20000);
    function onMsg(e) {
      if (e.origin !== NEW_ORIGIN || e.source !== tab || !e.data) return;
      if (e.data.type === "bh-move-ready") {
        tab.postMessage({ type: "bh-move", from: OLD_ORIGIN, data: collectForMove() }, NEW_ORIGIN);
      } else if (e.data.type === "bh-move-done") {
        clearTimeout(timer);
        window.removeEventListener("message", onMsg);
        try {
          localStorage.setItem(MOVED_KEY, "1");
        } catch {
          // Storage blocked: the bar stays, nothing else changes.
        }
        window.location.replace(NEW_ORIGIN + "/chat");
      }
    }
    window.addEventListener("message", onMsg);
  };

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-[60] rounded-2xl bg-indigo-600 text-[#fff] shadow-2xl px-4 py-3 text-sm">
      <p className="font-semibold">We have a new name and address: Nebulux AI at nebuluxai.com</p>
      <p className="mt-0.5 text-indigo-100 text-xs">Move your chats, drafts and settings there in one tap. You'll stay signed in.</p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={move}
          disabled={state === "moving"}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white text-indigo-700 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-50 disabled:opacity-70"
        >
          {state === "moving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
          {state === "moving" ? "Moving…" : "Move my chats to nebuluxai.com"}
        </button>
        {state === "failed" && <span className="text-xs text-amber-200">That didn't work. Allow pop-ups for this site and try again.</span>}
      </div>
    </div>
  );
}
