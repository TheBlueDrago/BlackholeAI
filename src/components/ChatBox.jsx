import React, { useState, useRef, useEffect } from "react";
import { Send, Square, Plus, X, Paperclip, ChevronUp, ChevronDown, ListOrdered } from "lucide-react";
import BlackholeIcon from "@/components/BlackholeIcon";
import { base44 } from "@/api/base44Client";

const CODE_SYS = "You are Blackhole Code Assistant. Help with programming. Give clear, correct code with brief explanations.";
const FABLE_SYS = "You are Space 5, Blackhole AI's premium creative model. Be imaginative and high-quality.";

export default function ChatBox({ conversation, createConversation, addMessage, removeMessage, renameConversation, plan, aiExhausted, aiCodeExhausted, onSpendAI, onSpendAICode, userInitial }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState([]);
  const [selectedAi, setSelectedAi] = useState("ai");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const reqIdRef = useRef(0);
  const lastTextRef = useRef("");
  const queueRef = useRef([]);
  const exhaustedRef = useRef(false);
  const qIdRef = useRef(0);

  const messages = conversation?.messages || [];
  const isCodeAi = selectedAi === "code";
  const exhausted = isCodeAi ? aiCodeExhausted : aiExhausted;
  exhaustedRef.current = exhausted;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, queue.length]);

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
      if (i < 0) return q;
      const j = i + dir;
      if (j < 0 || j >= q.length) return q;
      const n = [...q];
      const tmp = n[i];
      n[i] = n[j];
      n[j] = tmp;
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
    if (lastTextRef.current) setInput(lastTextRef.current);
  };

  const runPrompt = async (text) => {
    let convId = conversation?.id;
    const isFirst = !convId || (conversation?.messages?.length === 0);
    if (!convId) convId = createConversation();

    const fileNote = files.length ? `\n[Attached files: ${files.map((f) => f.name).join(", ")}]` : "";
    const sysPrefix = selectedAi === "code" ? CODE_SYS : selectedAi === "fable" ? FABLE_SYS : "";
    const fullPrompt = `${sysPrefix ? sysPrefix + "\n\n" : ""}${text}${fileNote}`;
    addMessage(convId, { role: "user", content: text + (files.length ? ` (attached: ${files.map((f) => f.name).join(", ")})` : "") });
    lastTextRef.current = text;
    setInput("");
    setLoading(true);
    const myId = ++reqIdRef.current;
    (isCodeAi ? onSpendAICode : onSpendAI)?.();
    try {
      const model = selectedAi === "ai" ? "automatic" : "claude_sonnet_4_6";
      const res = await base44.functions.invoke("chatCompletion", { prompt: fullPrompt, model });
      if (reqIdRef.current !== myId) return;
      const content = res.data?.content ?? "";
      addMessage(convId, { role: "ai", content });

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
        const q = queueRef.current;
        if (q.length > 0 && !exhaustedRef.current) {
          const [next, ...rest] = q;
          queueRef.current = rest;
          setQueue(rest);
          runPrompt(next.text);
        }
      }
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || exhausted) return;
    if (loading) {
      qPush(text);
      setInput("");
      return;
    }
    runPrompt(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const canSend = input.trim().length > 0 && !exhausted;

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
          {queue.length > 0 && (
            <div className="mb-2 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold">
                <ListOrdered className="w-3.5 h-3.5" />
                Queue ({queue.length}) — edit, reorder, or remove before they send
              </div>
              {queue.map((it, idx) => (
                <div
                  key={it.id}
                  className="flex items-center gap-1 bg-amber-900/20 border border-amber-600/40 rounded-lg pl-2 pr-1 py-0.5"
                >
                  <span className="text-[10px] text-amber-400 font-bold shrink-0 w-4 text-center">{idx + 1}</span>
                  <input
                    value={it.text}
                    onChange={(e) => qUpdate(it.id, e.target.value)}
                    className="flex-1 min-w-0 bg-transparent outline-none text-xs text-slate-100 py-1"
                  />
                  <button
                    onClick={() => qMove(it.id, -1)}
                    disabled={idx === 0}
                    className="p-1 rounded text-amber-300 hover:bg-amber-700/40 disabled:opacity-30 transition-colors"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => qMove(it.id, 1)}
                    disabled={idx === queue.length - 1}
                    className="p-1 rounded text-amber-300 hover:bg-amber-700/40 disabled:opacity-30 transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => qRemove(it.id)}
                    className="p-1 rounded text-slate-300 hover:text-red-400 hover:bg-red-900/40 transition-colors"
                    title="Remove from queue"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

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
              placeholder={loading ? "Type to queue your next message…" : "Message Blackhole AI..."}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-500 px-4 py-3 max-h-32 text-sm"
            />
            {loading && (
              <button
                onClick={stop}
                className="m-1.5 p-2.5 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors shrink-0"
                title="Stop generating"
              >
                <Square className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={send}
              disabled={!canSend}
              className="m-1.5 p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shrink-0"
              title={loading ? "Queue message" : "Send"}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach images or files"
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            {exhausted && (
              <p className="text-xs text-red-400 ml-auto">
                You're out of {isCodeAi ? "AI Code" : "AI"} credits. Switch AI or upgrade.
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