import React from "react";
import { Globe } from "lucide-react";
import { domainOf } from "@/lib/blackholeDomain";

export default function BrowserResults({ query, results, onOpen }) {
  return (
    <div className="flex-1 overflow-y-auto sidebar-scroll px-4 sm:px-8 py-5">
      <div className="max-w-2xl">
        <p className="text-xs text-slate-500 mb-5">
          {results.length ? `About ${results.length} result${results.length === 1 ? "" : "s"}` : "No results"} for <span className="text-slate-300">“{query}”</span>
        </p>
        {results.length === 0 && (
          <div className="text-slate-400 text-sm space-y-2">
            <p>Your search — <span className="text-slate-200 font-medium">{query}</span> — did not match any .blackhole website.</p>
            <p className="text-slate-500">Try the exact site name, e.g. <span className="font-mono text-slate-300">my-site.blackhole</span></p>
          </div>
        )}
        <div className="space-y-6">
          {results.map((s) => (
            <button key={s.id} onClick={() => onOpen(s.name)} className="group block text-left w-full">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0">
                  <Globe className="w-3.5 h-3.5 text-sky-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-300 truncate">{s.ownerName || "Blackhole site"}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">https://{domainOf(s.name)}</p>
                </div>
              </div>
              <p className="text-lg text-sky-300 group-hover:underline leading-snug">{s.name}</p>
              <p className="text-sm text-slate-400 mt-0.5">Website built with Blackhole AI Website Designer. Open {domainOf(s.name)} in Blackhole Browser.</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}