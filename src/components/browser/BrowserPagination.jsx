import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function BrowserPagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1.5 mt-10 pb-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="p-1.5 rounded-md text-slate-400 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-md text-sm transition-colors ${
            p === page ? "bg-slate-700/70 text-white font-semibold" : "text-sky-300 hover:bg-white/10"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        className="p-1.5 rounded-md text-slate-400 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}