import React, { useEffect, useState } from "react";
import { Loader2, ExternalLink, Flag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SiteThumb from "@/components/SiteThumb";
import { Link } from "react-router-dom";
import PublicLayout, { START_FREE } from "@/components/PublicLayout";
import { SITE_TEMPLATES } from "@/lib/siteTemplates";
import { siteUrl } from "@/lib/blackholeDomain";

// Public gallery of sites people built with Nebulux AI (owners opt in from the
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
    <PublicLayout title="Gallery">
      <div className="text-center py-10 sm:py-14">
        <h1 className="text-3xl sm:text-5xl font-bold text-white">Made with Nebulux AI</h1>
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
        <div className="text-center py-10">
          <p className="text-lg text-white font-semibold">The gallery is brand new: your site could be the first one here.</p>
          <p className="mt-2 text-slate-400">Build a site, publish it, then tap the star on it in the Website Designer to add it to the gallery.</p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
            {SITE_TEMPLATES.slice(0, 4).map((t) => (
              <Link key={t.id} to="/templates" className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-3 hover:border-indigo-500/50 transition-colors">
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-800">
                  <SiteThumb html={t.html} />
                </div>
                <p className="mt-3 px-1 text-sm font-medium text-white">{t.title} template</p>
              </Link>
            ))}
          </div>
          <Link to={START_FREE} className="mt-8 inline-flex items-center px-6 py-3 rounded-full bg-white text-slate-900 font-semibold hover:bg-slate-200">
            Get started for free
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sites.map((s) => (
            <div key={s.name} className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-3 hover:border-indigo-500/50 transition-colors">
              <a href={siteUrl(s.name) || "/showcase"} target="_blank" rel="noopener noreferrer" className="group block">
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-800">
                  <SiteThumb name={s.name} />
                </div>
                <div className="flex items-center gap-2 mt-3 px-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{s.title || s.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{s.name}.blackhole-ai-tech.com</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-200 shrink-0" />
                </div>
              </a>
              {/* Made by people, not us: anyone can flag one that breaks the rules. */}
              <Link
                to={`/report?${new URLSearchParams({ kind: "site", name: s.name })}`}
                className="mt-2 ml-1 inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-300"
                aria-label={`Report ${s.title || s.name}`}
              >
                <Flag className="w-3 h-3" /> Report
              </Link>
            </div>
          ))}
        </div>
      )}
    </PublicLayout>
  );
}
