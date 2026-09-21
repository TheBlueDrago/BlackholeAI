import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Menu, Globe, Plus, Sparkles, Loader2, Pencil, Trash2, Eye, EyeOff, Crown, ExternalLink,
} from "lucide-react";
import { useAppShell } from "@/components/AppShellContext";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import AiChooser from "@/components/AiChooser";
import { siteLimit } from "@/lib/publishLimits";
import { resetDesignerProject, loadDesignerHtmlIntoProject } from "@/lib/designerStore";

const SUGGESTIONS = [
  "A portfolio site for a photographer",
  "A landing page for a SaaS product",
  "An online menu for a restaurant",
  "A one-page site for a local gym",
];

function initialOf(s) {
  return (s || "?").trim().charAt(0).toUpperCase();
}

function SiteCard({ site, onEdit, onToggleHidden, onDelete }) {
  return (
    <div className="group relative rounded-2xl bg-slate-900/60 border border-slate-700/50 p-4 hover:border-indigo-500/40 transition-colors">
      <button onClick={() => onEdit(site)} className="w-full text-left">
        <div className="aspect-video rounded-xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 border border-slate-700/50 flex items-center justify-center mb-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg">
            {initialOf(site.name)}
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-100 truncate">{site.name}</p>
        <p className="text-[11px] text-slate-500 truncate">
          {site.name}.blackhole{site.hidden ? " · hidden" : ""}
        </p>
        <p className="text-[11px] text-slate-600 mt-0.5">
          Updated {site.updated_date ? formatDistanceToNow(new Date(site.updated_date), { addSuffix: true }) : "recently"}
        </p>
      </button>
      <div className="flex items-center gap-1.5 mt-3">
        <button
          onClick={() => onEdit(site)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          onClick={() => onToggleHidden(site)}
          title={site.hidden ? "Republish" : "Unpublish"}
          className={`flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
            site.hidden ? "bg-emerald-600/80 text-white hover:bg-emerald-500" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          {site.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        {!site.hidden && (
          <a
            href={`/chat/browser?q=${site.name}.blackhole`}
            title="View live"
            className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <button
          onClick={() => onDelete(site)}
          title="Delete"
          className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-red-900/50 text-red-300 text-xs hover:bg-red-900/70 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function DesignerDashboard() {
  const shell = useAppShell();
  const { sidebarOpen, setSidebarOpen, openProfile, avatarInitial, lightMode, toggleLight, navigate, effPlan, currentUser, conv, credits, isAdmin } = shell;
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [selectedAi, setSelectedAi] = useState("ai");
  const [err, setErr] = useState("");
  const textareaRef = useRef(null);

  const opusAllowed = effPlan === "pro" || effPlan === "team" || effPlan === "secret" || effPlan === "admin";
  const fableAllowed = effPlan === "team" || effPlan === "secret" || effPlan === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.PublishedSite.list("-updated_date", 200);
      setSites((list || []).filter((s) => currentUser?.role === "admin" || s.created_by_id === currentUser?.id));
    } catch (e) {
      setErr(e?.message || "Could not load your websites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const lim = siteLimit(effPlan);
  const atLimit = sites.length >= lim;

  const createSite = (text) => {
    resetDesignerProject();
    navigate("/chat/designer/build", { state: text ? { initialPrompt: text } : {} });
  };

  const handleCreate = () => {
    const text = prompt.trim();
    createSite(text || undefined);
  };

  const editSite = async (s) => {
    let html = s.html || "";
    if (/^https?:\/\//.test(html)) {
      html = await base44.functions
        .invoke("get-site-html", { name: s.name })
        .then((r) => r.data?.html || "")
        .catch(() => "");
    }
    loadDesignerHtmlIntoProject(s.name, html);
    navigate("/chat/designer/build");
  };

  const toggleHidden = async (s) => {
    try {
      await base44.entities.PublishedSite.update(s.id, { hidden: !s.hidden });
      load();
    } catch (e) {
      setErr(e?.message);
    }
  };

  const removeSite = async (s) => {
    if (!window.confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    try {
      await base44.entities.PublishedSite.delete(s.id);
      load();
    } catch (e) {
      setErr(e?.message);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100 overflow-hidden relative">
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]" />

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="sm:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute top-16 left-4 z-50">
              <Sidebar
                conversations={conv.conversations}
                activeId={conv.activeId}
                onSelect={(id) => { conv.selectConversation(id); navigate("/chat"); }}
                onRename={conv.renameConversation}
                onDelete={conv.deleteConversation}
                onRefresh={conv.reload}
                onGoHome={shell.goHome}
                onGoCode={shell.goCode}
                onNewChat={shell.newChat}
                onGoSubscriptions={shell.goPlans}
                onGoDesigner={shell.goDesigner}
                onGoBrowser={shell.goBrowser}
                onGoGames={shell.goGames}
                onGoMonitor={shell.goMonitor}
                isAdmin={isAdmin}
                credits={credits}
              />
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <header className="relative z-20 h-14 shrink-0 flex items-center gap-3 px-4 border-b border-slate-700/50 bg-slate-900/70 backdrop-blur-xl">
        <button onClick={() => setSidebarOpen((o) => !o)} className="p-2 rounded-lg hover:bg-slate-800 transition-colors" title="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">Website Designer</span>
        </div>
        <div className="flex-1" />
        <ThemeToggle light={lightMode} onToggle={toggleLight} />
        <button
          onClick={() => navigate("/chat/plans")}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Crown className="w-4 h-4" /> Upgrade
        </button>
        <button
          onClick={() => openProfile("main")}
          className="keep-color w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white"
          title="Account"
        >
          {avatarInitial}
        </button>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto sidebar-scroll">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          {/* Hero / create */}
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">What do you want to build?</h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base">Describe a website and Blackhole AI builds it live.</p>
          </div>

          <div className="max-w-2xl mx-auto bg-slate-900/70 border border-slate-700/50 rounded-2xl p-3 sm:p-4 shadow-2xl">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="A landing page for a coffee brand, with a menu and contact form..."
              rows={3}
              className="w-full bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-500 text-sm sm:text-base"
            />
            <div className="flex items-center justify-between mt-2">
              <AiChooser value={selectedAi} onChange={setSelectedAi} plan={effPlan} allowFable={true} />
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" /> Create
              </button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-2 mt-4">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="px-3 py-1.5 rounded-full bg-slate-800/70 border border-slate-700/50 text-slate-300 text-xs hover:bg-slate-700/70 hover:text-white transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Usage */}
          <div className="max-w-2xl mx-auto mt-8 flex items-center justify-between gap-3 px-1">
            <p className="text-xs text-slate-500">
              <span className="text-slate-300 font-medium">{sites.length}/{lim}</span> websites published on your{" "}
              <span className="capitalize text-slate-300">{effPlan}</span> plan
            </p>
            {atLimit && (
              <button onClick={() => navigate("/chat/plans")} className="text-xs text-amber-400 hover:text-amber-300 font-medium">
                Upgrade for more →
              </button>
            )}
          </div>

          {/* Your websites */}
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-300">Your websites</h2>
              <button
                onClick={() => createSite()}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New website
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : sites.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-700/60 rounded-2xl">
                <p className="text-slate-400 text-sm">You haven't published any websites yet.</p>
                <p className="text-slate-600 text-xs mt-1">Describe one above to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sites.map((s) => (
                  <SiteCard key={s.id} site={s} onEdit={editSite} onToggleHidden={toggleHidden} onDelete={removeSite} />
                ))}
              </div>
            )}
            {err && <p className="text-sm text-red-400 mt-4">{err}</p>}
          </section>
        </div>
      </main>
    </div>
  );
}
