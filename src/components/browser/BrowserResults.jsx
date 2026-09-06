import React, { useState, useEffect } from "react";
import { Globe, Gamepad2, ExternalLink } from "lucide-react";
import BrowserTabs from "@/components/browser/BrowserTabs";
import BrowserAnswer from "@/components/browser/BrowserAnswer";
import BrowserPagination from "@/components/browser/BrowserPagination";

const PER_PAGE = 8;

function ResultRow({ r, onOpen }) {
  const isWeb = r.kind === "web";
  const Icon = r.kind === "game" ? Gamepad2 : isWeb ? ExternalLink : Globe;
  const iconColor = r.kind === "game" ? "text-fuchsia-300" : isWeb ? "text-slate-300" : "text-sky-300";
  const open = () => (isWeb ? window.open(r.url, "_blank", "noopener") : onOpen(r.address));
  return (
    <button onClick={open} className="group block text-left w-full">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0">
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-300 truncate">{r.owner}</p>
          <p className="text-[11px] text-slate-500 font-mono truncate">{isWeb ? r.url : `https://${r.address}`}</p>
        </div>
      </div>
      <p className="text-lg text-sky-300 group-hover:underline leading-snug">{r.title}</p>
      <p className="text-sm text-slate-400 mt-0.5">{r.description}</p>
    </button>
  );
}

export default function BrowserResults({ query, results, web, onOpen }) {
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => { setTab("all"); setPage(1); }, [query]);
  useEffect(() => { setPage(1); }, [tab]);

  const webRows = (web.results || []).map((r, i) => ({
    id: "web-" + i,
    kind: "web",
    url: r.url,
    title: r.title,
    owner: r.site || "Web",
    description: r.description || "",
  }));

  const counts = {
    sites: results.filter((r) => r.kind === "site").length,
    games: results.filter((r) => r.kind === "game").length,
    web: webRows.length,
  };

  const all =
    tab === "sites" ? results.filter((r) => r.kind === "site")
    : tab === "games" ? results.filter((r) => r.kind === "game")
    : tab === "web" ? webRows
    : [...results, ...webRows];

  const pageCount = Math.ceil(all.length / PER_PAGE) || 1;
  const shown = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <BrowserTabs value={tab} onChange={setTab} counts={counts} />
      <div className="flex-1 overflow-y-auto sidebar-scroll px-4 sm:px-8 py-5">
        <div className="max-w-2xl">
          {tab === "all" && <BrowserAnswer loading={web.loading} label={web.answerLabel} answer={web.answer} />}
          <p className="text-xs text-slate-500 mb-5">
            {all.length ? `About ${all.length} result${all.length === 1 ? "" : "s"}` : web.loading ? "Searching…" : "No results"} for{" "}
            <span className="text-slate-300">“{query}”</span>
          </p>
          {all.length === 0 && !web.loading && (
            <div className="text-slate-400 text-sm space-y-2">
              <p>Your search — <span className="text-slate-200 font-medium">{query}</span> — did not match anything.</p>
              <p className="text-slate-500">Try the exact address, e.g. <span className="font-mono text-slate-300">my-site.blackhole</span> or <span className="font-mono text-slate-300">my-game.io</span></p>
            </div>
          )}
          <div className="space-y-6">
            {shown.map((r) => <ResultRow key={r.id} r={r} onOpen={onOpen} />)}
          </div>
          <BrowserPagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}