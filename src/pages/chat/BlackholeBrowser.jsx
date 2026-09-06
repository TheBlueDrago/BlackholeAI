import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, ArrowLeft, Home, RefreshCw, Lock, Search, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAppShell } from "@/components/AppShellContext";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import BrowserHome from "@/components/browser/BrowserHome";
import BrowserResults from "@/components/browser/BrowserResults";
import { domainOf, slugFromAddress } from "@/lib/blackholeDomain";

export default function BlackholeBrowser() {
  const shell = useAppShell();
  const { sidebarOpen, setSidebarOpen, openProfile, avatarInitial, lightMode, toggleLight, navigate, conv, credits, isAdmin } = shell;
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [input, setInput] = useState(q);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    base44.entities.PublishedSite.list("-created_date", 500)
      .then((rows) => setSites(rows || []))
      .catch(() => setSites([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => setInput(q), [q]);

  const byName = (n) => sites.find((s) => s.name === n);
  const query = q.trim().toLowerCase();
  const directSlug = slugFromAddress(query) ?? (/^[a-z-]+$/.test(query) && byName(query) ? query : null);
  const site = directSlug ? byName(directSlug) : null;

  const results = useMemo(() => {
    if (!query) return [];
    const term = slugFromAddress(query) ?? query;
    return sites.filter((s) => s.name.includes(term) || (s.ownerName || "").toLowerCase().includes(term));
  }, [sites, query]);

  const go = (text) => {
    const t = (text ?? input).trim();
    if (!t) return;
    setParams({ q: t });
  };
  const goHome = () => setParams({});
  const lucky = () => {
    const term = input.trim().toLowerCase();
    const first = term ? sites.find((s) => s.name.includes(term)) : sites[0];
    if (first) go(domainOf(first.name));
    else go();
  };

  const mode = !query ? "home" : site ? "site" : "results";

  return (
    <div className="h-screen flex flex-col bg-[#0b0f1a] text-slate-100 overflow-hidden relative">
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} />
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

      {/* Browser chrome */}
      <header className="h-14 shrink-0 flex items-center gap-2 px-3 border-b border-white/10 bg-[#0b0f1a]/90 backdrop-blur z-30">
        <button onClick={() => setSidebarOpen((o) => !o)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/10 text-slate-300 transition-colors" title="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={() => setReloadKey((k) => k + 1)} className="p-2 rounded-lg hover:bg-white/10 text-slate-300 transition-colors" title="Reload">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button onClick={goHome} className="p-2 rounded-lg hover:bg-white/10 text-slate-300 transition-colors" title="Home">
          <Home className="w-4 h-4" />
        </button>
        <form onSubmit={(e) => { e.preventDefault(); go(); }} className="flex-1 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 focus-within:border-white/30 rounded-full px-3 h-9 transition-colors">
            {mode === "site" ? <Lock className="w-3.5 h-3.5 text-emerald-300" /> : <Search className="w-4 h-4 text-slate-400" />}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search Blackhole or type a .blackhole address"
              className="bg-transparent outline-none text-sm flex-1 text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </form>
        <ThemeToggle light={lightMode} onToggle={toggleLight} />
        <button onClick={() => openProfile("main")} className="keep-color w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white" title="Account">
          {avatarInitial}
        </button>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : mode === "home" ? (
        <BrowserHome value={input} onChange={setInput} onSubmit={go} onLucky={lucky} />
      ) : mode === "site" ? (
        <iframe key={reloadKey} srcDoc={site.html} title={domainOf(site.name)} sandbox="allow-scripts" className="flex-1 w-full bg-white border-0" />
      ) : (
        <BrowserResults query={q} results={results} onOpen={(n) => go(domainOf(n))} />
      )}
    </div>
  );
}