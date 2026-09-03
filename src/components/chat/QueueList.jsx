import React from "react";
import { X, ChevronUp, ChevronDown, ListOrdered, Pause, Play } from "lucide-react";

export default function QueueList({ queue, paused, onTogglePause, onUpdate, onRemove, onMove }) {
  if (queue.length === 0 && !paused) return null;
  return (
    <div className="mb-2 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold">
        <ListOrdered className="w-3.5 h-3.5" />
        Queue ({queue.length}){paused ? " — paused" : " — edit, reorder, or remove before they send"}
        <button
          onClick={onTogglePause}
          className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-900/30 border border-amber-600/40 text-amber-200 hover:bg-amber-800/40 transition-colors"
          title={paused ? "Resume queue" : "Pause queue"}
        >
          {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          {paused ? "Resume" : "Pause"}
        </button>
      </div>
      {queue.map((it, idx) => (
        <div key={it.id} className="flex items-center gap-1 bg-amber-900/20 border border-amber-600/40 rounded-lg pl-2 pr-1 py-0.5">
          <span className="text-[10px] text-amber-400 font-bold shrink-0 w-4 text-center">{idx + 1}</span>
          <input
            value={it.text}
            onChange={(e) => onUpdate(it.id, e.target.value)}
            className="flex-1 min-w-0 bg-transparent outline-none text-xs text-slate-100 py-1"
          />
          <button onClick={() => onMove(it.id, -1)} disabled={idx === 0} className="p-1 rounded text-amber-300 hover:bg-amber-700/40 disabled:opacity-30 transition-colors" title="Move up">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onMove(it.id, 1)} disabled={idx === queue.length - 1} className="p-1 rounded text-amber-300 hover:bg-amber-700/40 disabled:opacity-30 transition-colors" title="Move down">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onRemove(it.id)} className="p-1 rounded text-slate-300 hover:text-red-400 hover:bg-red-900/40 transition-colors" title="Remove from queue">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}