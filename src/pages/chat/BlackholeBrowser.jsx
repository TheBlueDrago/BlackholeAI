import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, ArrowLeft, Home, RefreshCw, Lock, Search, Loader2, Flag } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAppShell } from "@/components/AppShellContext";
import { base44 } from "@/api/base44Client";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import BrowserHome from "@/components/browser/BrowserHome";
import BrowserResults from "@/components/browser/BrowserResults";
import BrowserGameFrame from "@/components/browser/BrowserGameFrame";
import BrowserSiteFrame from "@/components/browser/BrowserSiteFrame";
import BrowserWebFrame from "@/components/browser/BrowserWebFrame";
import { domainOf, gameDomainOf, cleanAddress, resolveAddress, makerName } from "@/lib/blackholeDomain";
import { builtInGameEntities, findBuiltInGame } from "@/lib/builtInGames";
import { useWebSearch } from "@/hooks/useWebSearch";
import useSiteCheckout from "@/hooks/useSiteCheckout";

const LUCKY_PLACES = ["Kyoto, Japan", "Reykjavik, Iceland", "Machu Picchu", "Marrakech, Morocco", "Queenstown, New Zealand", "Santorini, Greece", "Banff National Park", "Petra, Jordan"];

export default function BlackholeBrowser() {
  const shell = useAppShell();
  const { sidebarOpen, setSidebarOpen, openProfile, avatarInitial, lightMode, toggleLight, navigate, conv, credits, isAdmin } = shell;
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const weburl = params.get("weburl") || "";
  const [input, setInput] = useState(q || weburl);
  const [sites, setSites] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    Promise.all([
      base44.entities.PublishedSite.list("-created_date", 500).catch(() => []),
      base44.entities.PublishedGame.list("-plays", 500).catch(() => []),
    ])
      .then(([s, g]) => {
        setSites((s || []).filter((x) => !x.hidden));
        const real = (g || []).filter((x) => !x.hidden);
        const realNames = new Set(real.map((x) => x.name));
        setGames([...builtInGameEntities().filter((x) => !realNames.has(x.name)), ...real]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => setInput(weburl || q), [q, weburl]);

  const query = q.trim().toLowerCase();
  const hit = resolveAddress(query, sites, games);

  const results = useMemo(() => {
    if (!query) return [];
    const term = cleanAddress(query);
    const match = (...fields) => fields.some((f) => (f || "").toLowerCase().includes(term));
    const siteRows = sites
      .filter((s) => match(s.name, domainOf(s.name), s.ownerName))
      .map((s) => ({ id: s.id, kind: "site", address: domainOf(s.name), title: s.name, owner: makerName(s.ownerName), description: `Website built with Blackhole AI Website Designer. Open ${domainOf(s.name)} in Blackhole Browser.` }));
    const gameRows = games
      .filter((g) => match(g.name, g.title, gameDomainOf(g.name, g.genre), g.ownerName))
      .map((g) => ({ id: g.id, kind: "game", address: gameDomainOf(g.name, g.genre), title: g.title || g.name, owner: makerName(g.ownerName), description: `${g.genre} game on Blackhole Games · ${g.plays || 0} plays. Play ${gameDomainOf(g.name, g.genre)} in Blackhole Browser.` }));
    return [...siteRows, ...gameRows];
  }, [sites, games, query]);

  const go = (text) => {
    const t = (text ?? input).trim();
    if (!t) return;
    setParams({ q: t });
  };
  const openWeb = (url) => setParams({ q, weburl: url });
  const goHome = () => setParams({});
  const lucky = () => {
    const pool = [
      ...games.map((g) => gameDomainOf(g.name, g.genre)),
      ...sites.map((s) => domainOf(s.name)),
    ];
    if (pool.length) {
      go(pool[Math.floor(Math.random() * pool.length)]);
      return;
    }
    // Nothing published yet — surprise them with a random place to read about.
    go(LUCKY_PLACES[Math.floor(Math.random() * LUCKY_PLACES.length)]);
  };

  const mode = weburl ? "web" : !query ? "home" : hit ? hit.kind : "results";
  useSiteCheckout(hit?.kind === "site" ? hit.item.name : null);
  const web = useWebSearch(q.trim(), mode === "results");

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative">
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
      <header className="h-14 shrink-0 flex items-center gap-2 px-3 border-b border-white/10 bg-slate-950/90 backdrop-blur z-30">
        <button onClick={() => setSidebarOpen((o) => !o)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/10 text-slate-300 transition-colors" title="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={() => setReloadKey((k) => k + 1)} className="p-2 rounded-lg hover:bg-white/10 text-slate-300 transition-colors" title="Reload">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button onClick={goHome} className="hidden sm:inline-flex p-2 rounded-lg hover:bg-white/10 text-slate-300 transition-colors" title="Home">
          <Home className="w-4 h-4" />
        </button>
        {(mode === "site" || (mode === "game" && !findBuiltInGame(hit.item.name))) && (
          <a
            href={`/report?${new URLSearchParams({ kind: mode, name: hit.item.name })}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-300 transition-colors"
            title={`Report this ${mode}`}
          >
            <Flag className="w-4 h-4" />
          </a>
        )}
        {/* min-w-0 lets the address bar shrink on phones instead of pushing the buttons off-screen. */}
        <form onSubmit={(e) => { e.preventDefault(); go(); }} className="flex-1 min-w-0 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 focus-within:border-white/30 rounded-full px-3 h-9 transition-colors">
            {hit ? <Lock className="w-3.5 h-3.5 shrink-0 text-emerald-300" /> : <Search className="w-4 h-4 shrink-0 text-slate-400" />}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search Blackhole or type an address (name.blackhole, name.io…)"
              className="bg-transparent outline-none text-sm flex-1 min-w-0 text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </form>
        <ThemeToggle light={lightMode} onToggle={toggleLight} />
        <button onClick={() => openProfile("main")} className="keep-color shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white" title="Account">
          {avatarInitial}
        </button>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : mode === "home" ? (
        <BrowserHome value={input} onChange={setInput} onSubmit={go} onLucky={lucky} />
      ) : mode === "site" ? (
        <BrowserSiteFrame name={hit.item.name} title={domainOf(hit.item.name)} reloadKey={reloadKey} />
      ) : mode === "game" ? (
        <BrowserGameFrame name={hit.item.name} reloadKey={reloadKey} />
      ) : mode === "web" ? (
        <BrowserWebFrame url={weburl} reloadKey={reloadKey} />
      ) : (
        <BrowserResults query={q} results={results} web={web} onOpen={go} onOpenWeb={openWeb} />
      )}
    </div>
  );
}