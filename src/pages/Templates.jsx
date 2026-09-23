import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { SITE_TEMPLATES } from "@/lib/siteTemplates";
import { loadDesignerHtmlIntoProject } from "@/lib/designerStore";
import PublicLayout from "@/components/PublicLayout";
import SiteThumb from "@/components/SiteThumb";

// Public list of the Website Designer's starter templates. "Use this template" opens it in
// the designer; people without an account sign up first and land there with it open
// (DesignerDashboard reads ?template=).
export default function Templates() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const use = (t) => {
    if (isAuthenticated) {
      loadDesignerHtmlIntoProject(`my-${t.id}`, t.html);
      navigate("/chat/designer/build");
    } else {
      navigate("/register?returnTo=" + encodeURIComponent(`/chat/designer?template=${t.id}`));
    }
  };

  return (
    <PublicLayout title="Free website templates">
      <section className="text-center pt-8 pb-10">
        <h1 className="text-3xl sm:text-5xl font-bold text-white">Free website templates</h1>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">
          Pick one, then change anything by telling the AI what you want: words, colors, pages, a shop. Publish it free at
          <span className="text-slate-200"> yourname.blackhole-ai-tech.com</span>.
        </p>
      </section>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {SITE_TEMPLATES.map((t) => (
          <div key={t.id} className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-3">
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-800">
              <SiteThumb html={t.html} />
            </div>
            <div className="flex items-center justify-between gap-3 mt-3 px-1">
              <div className="min-w-0">
                <h2 className="font-semibold text-white">{t.title}</h2>
                <p className="text-xs text-slate-400">{t.blurb}</p>
              </div>
              <button
                onClick={() => use(t)}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white text-sm font-semibold hover:opacity-90"
              >
                Use this template <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-slate-500 text-sm mt-10">
        Want something else? Describe any website in a sentence and the AI builds it from scratch.
      </p>
    </PublicLayout>
  );
}
