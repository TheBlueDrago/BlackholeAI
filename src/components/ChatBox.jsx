import React, { useState, useRef, useEffect } from "react";
import { Send, Square, Plus, X, Paperclip } from "lucide-react";
import BlackholeIcon from "@/components/BlackholeIcon";
import AiChooser from "@/components/AiChooser";
import QueueList from "@/components/chat/QueueList";
import { base44 } from "@/api/base44Client";

const CODE_SYS = "You are Blackhole Code Assistant. Help with programming. Give clear, correct code with brief explanations.";
const AI_NAMES = { ai: "Blackhole AI", code: "Blackhole Code" };

export default function ChatBox({ conversation, createConversation, addMessage, removeMessage, renameConversation, plan, aiExhausted, aiCodeExhausted, aiRemaining, aiCodeRemaining, onSpendAI, onSpendAICode, userInitial }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState([]);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedAi, setSelectedAi] = useState("ai");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const reqIdRef = useRef(0);
  const queueRef = useRef([]);
  const pausedRef = useRef(false);
  const selectedAiRef = useRef("ai");
  const remainingRef = useRef({});
  const qIdRef = useRef(0);

  const messages = conversation?.messages || [];
  const isCodeAi = selectedAi === "code";
  const exhausted = isCodeAi ? aiCodeExhausted : aiExhausted;
  remainingRef.current = { ai: aiRemaining ?? (aiExhausted ? 0 : 1), code: aiCodeRemaining ?? (aiCodeExhausted ? 0 : 1) };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, queue.length]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  const chooseAi = (id) => {
    selectedAiRef.current = id;
    setSelectedAi(id);
  };

  const commitQueue = (updater) => {
    setQueue((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      queueRef.current = next;
      return next;
    });
  };

  const qPush = (text) => commitQueue((q) => [...q, { id: ++qIdRef.current, text }]);
  const qUpdate = (id, text) => commitQueue((q) => q.map((x) => (x.id === id ? { ...x, text } : x)));
  const qRemove = (id) => commitQueue((q) => q.filter((x) => x.id !== id));
  const qMove = (id, dir) =>
    commitQueue((q) => {
      const i = q.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= q.length) return q;
      const n = [...q];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const stop = () => {
    reqIdRef.current++;
    setLoading(false);
    const convId = conversation?.id;
    const msgs = conversation?.messages || [];
    if (convId && msgs.length && msgs[msgs.length - 1].role === "user") {
      removeMessage?.(convId, msgs.length - 1);
    }
    setInput("");
  };

  // Runs the next queued message, switching AI to the one with the most credits if the current one is out.
  const runNext = () => {
    if (pausedRef.current) return;
    const q = queueRef.current;
    if (!q.length) return;
    let ai = selectedAiRef.current;
    const rem = remainingRef.current;
    if (rem[ai] <= 0) {
      const best = Object.keys(AI_NAMES).sort((a, b) => rem[b] - rem[a])[0];
      if (rem[best] <= 0) return;
      setNotice(`You ran out of ${AI_NAMES[ai]} credits so we changed your ai to ${AI_NAMES[best]}`);
      chooseAi(best);
      ai = best;
    }
    const [next, ...rest] = q;
    queueRef.current = rest;
    setQueue(rest);
    runPrompt(next.text, ai);
  };

  const runPrompt = async (text, ai) => {
    let convId = conversation?.id;
    const isFirst = !convId || (conversation?.messages?.length === 0);
    if (!convId) convId = createConversation();

    const fileNote = files.length ? `\n[Attached files: ${files.map((f) => f.name).join(", ")}]` : "";
    const fullPrompt = `${ai === "code" ? CODE_SYS + "\n\n" : ""}${text}${fileNote}`;
    addMessage(convId, { role: "user", content: text + (files.length ? ` (attached: ${files.map((f) => f.name).join(", ")})` : "") });
    setInput("");
    setLoading(true);
    const myId = ++reqIdRef.current;
    (ai === "code" ? onSpendAICode : onSpendAI)?.();
    try {
      const model = ai === "code" ? "claude_sonnet_4_6" : "automatic";
      const res = await base44.functions.invoke("chatCompletion", { prompt: fullPrompt, model });
      if (reqIdRef.current !== myId) return;
      addMessage(convId, { role: "ai", content: res.data?.content ?? "" });

      if (isFirst) {
        try {
          const titleRes = await base44.functions.invoke("chatCompletion", {
            prompt: `Create a very short title (max 4 words, no quotes, no trailing punctuation) summarizing what this chat is about based on the user's first message: "${text}". Respond with only the title.`,
          });
          const title = (titleRes.data?.content ?? "").trim().slice(0, 50);
          if (title && reqIdRef.current === myId) renameConversation(convId, title);
        } catch {}
      }
    } catch {
      if (reqIdRef.current !== myId) return;
      addMessage(convId, { role: "ai", content: "Sorry, something went wrong. Please try again." });
    } finally {
      if (reqIdRef.current === myId) {
        setLoading(false);
        runNext();
      }
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    if (loading || paused || queueRef.current.length > 0) {
      qPush(text);
      setInput("");
      if (!loading) runNext();
      return;
    }
    if (exhausted) return;
    runPrompt(text, selectedAi);
  };

  const togglePause = () => {
    const next = !paused;
    pausedRef.current = next;
    setPaused(next);
    if (!next && !loading) runNext();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const canSend = input.trim().length > 0 && (loading || paused || !exhausted);
  const showStop = loading && !focused;

  return (
    <div className="w-full max-w-3xl px-3 sm:px-4">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">
        <div ref={scrollRef} className="h-[55vh] sm:h-96 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="keep-color w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center mb-3">
                <BlackholeIcon className="w-7 h-7" />
              </div>
              <p className="text-slate-300 font-medium">Ask me anything</p>
              <p className="text-slate-500 text-sm mt-1">Blackhole AI is ready to help</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm"
                    : "bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/50"
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
              <div className="bg-slate-800 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2.5">
                <BlackholeIcon className="w-5 h-5 animate-spin" />
                <span className="text-slate-300 text-sm animate-pulse">
                  Thinking...{queue.length > 0 ? ` (${queue.length} queued)` : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700/50 p-3">
          {notice && (
            <div className="mb-2 flex items-start gap-2 bg-indigo-900/30 border border-indigo-500/40 rounded-lg px-3 py-2 text-xs text-indigo-100">
              <span className="flex-1">{notice}</span>
              <button onClick={() => setNotice("")} className="text-indigo-300 hover:text-white" title="Dismiss">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <QueueList queue={queue} paused={paused} onTogglePause={togglePause} onUpdate={qUpdate} onRemove={qRemove} onMove={qMove} />

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700/50 rounded-lg px-2 py-1 text-xs text-slate-200">
                  <Paperclip className="w-3 h-3 text-slate-400" />
                  <span className="max-w-[140px] truncate">{f.name}</span>
                  <button onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 bg-slate-800/70 rounded-2xl border border-slate-700/50 focus-within:border-indigo-500/50 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={loading || paused ? "Type to queue your next message…" : "Message Blackhole AI..."}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-500 px-4 py-3 max-h-32 text-sm"
            />
            {showStop ? (
              <button
                onClick={stop}
                className="m-1.5 p-2.5 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors shrink-0"
                title="Stop generating"
              >
                <Square className="w-5 h-5" />
              </button>
            ) : (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={send}
                disabled={!canSend}
                className="m-1.5 p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shrink-0"
                title={loading || paused ? "Add to queue" : "Send"}
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach images or files"
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <AiChooser value={selectedAi} onChange={chooseAi} plan={plan} allowFable={false} />
            {exhausted && (
              <p className="text-xs text-red-400 ml-auto">
                You're out of {AI_NAMES[selectedAi]} credits. Switch AI or upgrade.
              </p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const fs = Array.from(e.target.files || []);
              if (fs.length) setFiles((prev) => [...prev, ...fs]);
              e.target.value = "";
            }}
          />
          <p className="text-center text-xs text-slate-600 mt-2">Blackhole AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
}