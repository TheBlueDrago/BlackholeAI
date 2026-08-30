import React, { useState, useRef, useEffect } from "react";
import { Send, Terminal, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CodePage({ aiCodeExhausted, onSpendAICode }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || aiCodeExhausted) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    onSpendAICode?.();

    try {
      const res = await base44.functions.invoke("chatCompletion", {
        prompt: text,
        model: "claude-sonnet-5",
      });
      const content = res.data?.content ?? "";
      setMessages((m) => [...m, { role: "ai", content }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ai", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="w-full max-w-3xl px-3 sm:px-4">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-emerald-700/40 rounded-3xl overflow-hidden shadow-2xl">
        <div ref={scrollRef} className="h-[55vh] sm:h-96 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="keep-color w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <p className="text-slate-200 font-medium text-lg">Let's start coding</p>
              <p className="text-slate-500 text-sm mt-1">Blackhole Code is ready to build</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-sm"
                    : "bg-slate-800 text-slate-100 rounded-bl-sm border border-emerald-700/40"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-emerald-700/40 px-4 py-3 rounded-2xl rounded-bl-sm">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-emerald-700/40 p-3">
          <div className="flex items-end gap-2 bg-slate-800/70 rounded-2xl border border-emerald-700/40 focus-within:border-emerald-500/50 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Blackhole AI..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-500 px-4 py-3 max-h-32 text-sm"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading || aiCodeExhausted}
              className="m-1.5 p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {aiCodeExhausted && (
            <p className="text-center text-xs text-red-400 mt-2">You're out of AI Code credits.</p>
          )}
          <p className="text-center text-xs text-slate-600 mt-2">Blackhole AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
}