import React from "react";
import { Globe, Gamepad2 } from "lucide-react";

// results: [{ id, address, title, owner, description, kind: "site" | "game" }]
export default function BrowserResults({ query, results, onOpen }) {
  return (
    <div className="flex-1 overflow-y-auto sidebar-scroll px-4 sm:px-8 py-5">
      <div className="max-w-2xl">
        <p className="text-xs text-slate-500 mb-5">
          {results.length ? `About ${results.length} result${results.length === 1 ? "" : "s"}` : "No results"} for <span className="text-slate-300">“{query}”</span>
        </p>
        {results.length === 0 && (
          <div className="text-slate-400 text-sm space-y-2">
            <p>Your search — <span className="text-slate-200 font-medium">{query}</span> — did not match any website or game.</p>
            <p className="text-slate-500">Try the exact address, e.g. <span className="font-mono text-slate-300">my-site.blackhole</span> or <span className="font-mono text-slate-300">my-game.io</span></p>
          </div>
        )}
        <div className="space-y-6">
          {results.map((r) => {
            const Icon = r.kind === "game" ? Gamepad2 : Globe;
            return (
              <button key={r.id} onClick={() => onOpen(r.address)} className="group block text-left w-full">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${r.kind === "game" ? "text-fuchsia-300" : "text-sky-300"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-300 truncate">{r.owner || (r.kind === "game" ? "Blackhole game" : "Blackhole site")}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">https://{r.address}</p>
                  </div>
                </div>
                <p className="text-lg text-sky-300 group-hover:underline leading-snug">{r.title}</p>
                <p className="text-sm text-slate-400 mt-0.5">{r.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}