import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Sparkles, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SiteThumb from "@/components/SiteThumb";

// Public gallery of sites people built with Blackhole AI (owners opt in from the
// Website Designer). Doubles as a landing page for visitors who aren't signed up.
export default function Showcase() {
  const [sites, setSites] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.functions
      .invoke("showcase", { action: "list" })
      .then((r) => setSites(r.data?.sites || []))
      .catch(() => setError("Couldn't load the gallery. Try again in a minute."));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100">
      <header className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 py-5">
        <Link to="/" className="font-bold tracking-tight">Blackhole AI</Link>
        <Link
          to="/chat/designer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90"
        >
          <Sparkles className="w-4 h-4" /> Build yours
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center py-10 sm:py-14">
          <h1 className="text-3xl sm:text-5xl font-bold text-white">Made with Blackhole AI</h1>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            Real websites people described in a sentence and published in minutes. Describe yours and it's live at
            <span className="text-slate-200"> yourname.blackhole-ai-tech.com</span>.
          </p>
        </div>

        {error ? (
          <p className="text-center text-red-400 text-sm">{error}</p>
        ) : !sites ? (
          <div className="flex justify-center py-16 text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : sites.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-16">No sites in the gallery yet — be the first.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sites.map((s) => (
              <a
                key={s.name}
                href={`https://${s.name}.blackhole-ai-tech.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl bg-slate-900/60 border border-slate-700/50 p-3 hover:border-indigo-500/50 transition-colors"
              >
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-800">
                  <SiteThumb name={s.name} />
                </div>
                <div className="flex items-center gap-2 mt-3 px-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{s.title || s.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{s.name}.blackhole-ai-tech.com</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-500 pb-8 space-x-3">
        <Link to="/terms" className="hover:underline">Terms</Link>
        <Link to="/privacy" className="hover:underline">Privacy</Link>
        <Link to="/report" className="hover:underline">Report a site</Link>
        <Link to="/contact" className="hover:underline">Contact</Link>
      </footer>
    </div>
  );
}
