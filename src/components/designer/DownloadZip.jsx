import React, { useState } from "react";
import { Download, Loader2, Lock } from "lucide-react";
import JSZip from "jszip";

export default function DownloadZip({ html, name, plan, onUpgrade }) {
  const [downloading, setDownloading] = useState(false);
  const canDownload = plan === "pro" || plan === "team" || plan === "secret" || plan === "admin";

  const handleDownload = async () => {
    if (!canDownload || !html || downloading) return;
    setDownloading(true);
    try {
      const zip = new JSZip();
      zip.file("index.html", html);
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name || "website"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      // ignore
    } finally {
      setDownloading(false);
    }
  };

  if (!canDownload) {
    return (
      <button
        type="button"
        onClick={onUpgrade}
        title="Download ZIP requires Pro or above"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50 text-slate-400 text-sm font-medium hover:bg-slate-700/70 transition-colors"
      >
        <Lock className="w-4 h-4" />
        <span className="hidden sm:inline">ZIP</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={!html || downloading}
      title="Download website as ZIP"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50 text-slate-200 text-sm font-medium hover:bg-slate-700/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      <span className="hidden sm:inline">ZIP</span>
    </button>
  );
}