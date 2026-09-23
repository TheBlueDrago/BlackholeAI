import React, { useState } from "react";
import { Share2, Check } from "lucide-react";

// "Share" button for the publish toast: the phone/computer share sheet when there is
// one, otherwise copies the link. Sharing a fresh page is how most new visitors arrive.
export default function ShareLink({ url, title, className = "ml-1 bg-white/20 hover:bg-white/30" }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `Check out ${title}, made with Blackhole AI:`, url });
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };
  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${className}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
