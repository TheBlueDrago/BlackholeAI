import React from "react";
import { X, ChevronUp, ChevronDown, ListOrdered, Pause, Play } from "lucide-react";

// Renders the queue notice + pending queued messages. Pass the object returned by useMessageQueue as `q`.
export default function QueueList({ q, loading }) {
  const { queue, paused, notice, dismissNotice, update, remove, move, togglePause } = q;
  return (
    <>
      {notice && (
        <div className="mb-2 flex items-start gap-2 bg-indigo-900/30 border border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-indigo-100">
          <span className="flex-1">{notice}</span>
          <button onClick={dismissNotice} className="text-indigo-300 hover:text-white" title="Dismiss">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {(queue.length > 0 || paused) && (
        <div className="mb-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold">
            <ListOrdered className="w-3.5 h-3.5" />
            Queue ({queue.length}){paused ? " — paused" : " — edit, reorder, or remove before they send"}
            <button
              onClick={() => togglePause(loading)}
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
              <input value={it.text} onChange={(e) => update(it.id, e.target.value)} className="flex-1 min-w-0 bg-transparent outline-none text-xs text-slate-100 py-1" />
              <button onClick={() => move(it.id, -1)} disabled={idx === 0} className="p-1 rounded text-amber-300 hover:bg-amber-700/40 disabled:opacity-30 transition-colors" title="Move up">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => move(it.id, 1)} disabled={idx === queue.length - 1} className="p-1 rounded text-amber-300 hover:bg-amber-700/40 disabled:opacity-30 transition-colors" title="Move down">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => remove(it.id)} className="p-1 rounded text-slate-300 hover:text-red-400 hover:bg-red-900/40 transition-colors" title="Remove from queue">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}