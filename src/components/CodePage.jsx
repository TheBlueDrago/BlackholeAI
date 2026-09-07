import React, { useState, useRef, useEffect } from "react";
import { Terminal } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BlackholeIcon from "@/components/BlackholeIcon";
import QueueList from "@/components/chat/QueueList";
import SendOrStopButton from "@/components/chat/SendOrStopButton";
import useMessageQueue from "@/hooks/useMessageQueue";
import useBuildMode, { BUILD_NOTE, ANSWER_NOTE, resolveIntent } from "@/hooks/useBuildMode";
import ModeToggle from "@/components/chat/ModeToggle";

export default function CodePage({ aiCodeExhausted, aiCodeRemaining, onSpendAICode, userInitial }) {
  const buildMode = useBuildMode("code");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const scrollRef = useRef(null);
  const reqIdRef = useRef(0);

  const runPrompt = async (text) => {
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    const myId = ++reqIdRef.current;
    const intent = resolveIntent(text, buildMode.mode);
    onSpendAICode?.(intent.cost);
    try {
      const modeNote = intent.build ? BUILD_NOTE : ANSWER_NOTE;
      const res = await base44.functions.invoke("chatCompletion", { prompt: `${modeNote}\n\n${text}`, model: "claude-sonnet-5" });
      if (reqIdRef.current !== myId) return;
      setMessages((m) => [...m, { role: "ai", content: res.data?.content ?? "" }]);
    } catch {
      if (reqIdRef.current !== myId) return;
      setMessages((m) => [...m, { role: "ai", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      if (reqIdRef.current === myId) {
        setLoading(false);
        q.runNext();
      }
    }
  };

  const q = useMessageQueue({ run: runPrompt, remaining: { code: aiCodeRemaining ?? (aiCodeExhausted ? 0 : Infinity) }, names: { code: "Blackhole Code" }, selectedAi: "code" });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, q.queue.length]);

  const stop = () => {
    reqIdRef.current++;
    setLoading(false);
    setInput("");
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    if (q.shouldQueue(loading)) {
      q.push(text);
      setInput("");
      if (!loading) q.runNext();
      return;
    }
    if (aiCodeExhausted) return;
    runPrompt(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const queued = loading || q.paused;
  const canSend = input.trim().length > 0 && (queued || !aiCodeExhausted);

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
            <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-sm"
                    : "bg-slate-800 text-slate-100 rounded-bl-sm border border-emerald-700/40"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="keep-color w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {userInitial || "U"}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-emerald-700/40 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2.5">
                <BlackholeIcon className="w-5 h-5 animate-spin" />
                <span className="text-slate-300 text-sm animate-pulse">
                  Thinking...{q.queue.length > 0 ? ` (${q.queue.length} queued)` : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-emerald-700/40 p-3">
          <QueueList q={q} loading={loading} />
          <div className="flex items-end gap-2 bg-slate-800/70 rounded-2xl border border-emerald-700/40 focus-within:border-emerald-500/50 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={queued ? "Type to queue your next message…" : "Message Blackhole AI..."}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-500 px-4 py-3 max-h-32 text-sm"
            />
            <SendOrStopButton loading={loading} focused={focused} queued={queued} canSend={canSend} onSend={send} onStop={stop} gradient="from-emerald-500 to-teal-500" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <ModeToggle mode={buildMode.mode} onChange={buildMode.setMode} />
            {aiCodeExhausted && <p className="text-xs text-red-400 ml-auto">You're out of AI Code credits.</p>}
          </div>
          <p className="text-center text-xs text-slate-600 mt-2">Blackhole AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
}