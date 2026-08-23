import React, { useState } from "react";
import { Send, Terminal } from "lucide-react";

export default function CodePage({ onSubmit }) {
  const [input, setInput] = useState("");

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    onSubmit(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="w-full max-w-3xl px-4">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-emerald-700/40 rounded-3xl overflow-hidden shadow-2xl">
        <div className="h-80 sm:h-96 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-200 font-medium text-lg">Let's start coding</p>
          <p className="text-slate-500 text-sm mt-1">Infinity AI Code is ready to build</p>
        </div>
        <div className="border-t border-emerald-700/40 p-3">
          <div className="flex items-end gap-2 bg-slate-800/70 rounded-2xl border border-emerald-700/40 focus-within:border-emerald-500/50 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Infinity AI..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-500 px-4 py-3 max-h-32 text-sm"
            />
            <button
              onClick={submit}
              disabled={!input.trim()}
              className="m-1.5 p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-600 mt-2">Infinity AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
}