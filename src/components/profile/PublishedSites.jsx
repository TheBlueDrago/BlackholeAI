import React, { useState, useEffect } from "react";
import { askConfirm } from "@/lib/dialogs";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Loader2, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { siteLimit } from "@/lib/publishLimits";
import { loadDesignerHtmlIntoProject } from "@/lib/designerStore";

export default function PublishedSites({ user, plan, onBack }) {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const list = await base44.entities.PublishedSite.list("-updated_date", 200);
      setSites((list || []).filter((s) => user?.role === "admin" || s.created_by_id === user?.id));
    } catch (e) {
      setErr(e?.message || "Could not load websites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const edit = async (s) => {
    let html = s.html || "";
    if (/^https?:\/\//.test(html)) {
      html = await base44.functions
        .invoke("get-site-html", { name: s.name })
        .then((r) => r.data?.html || "")
        .catch(() => "");
    }
    loadDesignerHtmlIntoProject(s.name, html);
    navigate("/chat/designer/build", { replace: true });
  };

  const toggleHidden = async (s) => {
    try {
      await base44.entities.PublishedSite.update(s.id, { hidden: !s.hidden });
      load();
    } catch (e) {
      setErr(e?.message);
    }
  };

  const remove = async (s) => {
    if (!await askConfirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    try {
      await base44.entities.PublishedSite.delete(s.id);
      load();
    } catch (e) {
      setErr(e?.message);
    }
  };

  const lim = siteLimit(plan);

  return (
    <div className="p-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 text-sm hover:text-slate-200 transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-2 mb-1">
        <Globe className="w-5 h-5 text-sky-300" />
        <h3 className="text-lg font-semibold text-white">Published Websites</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        {sites.length}/{lim} used on your {plan} plan · deleting one frees a slot
      </p>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : sites.length === 0 ? (
        <p className="text-slate-500 text-sm py-6 text-center">You haven't published any websites yet.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto sidebar-scroll pr-1">
          {sites.map((s) => (
            <div key={s.id} className="rounded-xl bg-slate-800 border border-slate-700/50 p-3">
              <p className="text-sm font-medium text-slate-100 truncate">{s.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{s.name}.blackhole-ai-tech.com{s.hidden ? " · hidden" : ""}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <button onClick={() => edit(s)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-xs hover:bg-slate-600 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => toggleHidden(s)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors ${s.hidden ? "bg-emerald-600/80 text-white hover:bg-emerald-500" : "bg-slate-700 text-slate-200 hover:bg-slate-600"}`}
                >
                  {s.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {s.hidden ? "Republish" : "Unpublish"}
                </button>
                <button onClick={() => remove(s)} className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-red-900/50 text-red-300 text-xs hover:bg-red-900/70 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {err && <p className="text-sm text-red-400 mt-3">{err}</p>}
    </div>
  );
}