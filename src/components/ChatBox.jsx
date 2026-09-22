import React, { useState, useRef, useEffect } from "react";
import { Plus, X, Paperclip } from "lucide-react";
import BlackholeIcon from "@/components/BlackholeIcon";
import AiChooser from "@/components/AiChooser";
import QueueList from "@/components/chat/QueueList";
import SendOrStopButton from "@/components/chat/SendOrStopButton";
import useMessageQueue from "@/hooks/useMessageQueue";
import useBuildMode, { BUILD_NOTE, ANSWER_NOTE, resolveIntent } from "@/hooks/useBuildMode";
import ModeToggle from "@/components/chat/ModeToggle";
import { base44 } from "@/api/base44Client";
import { OUT_OF_CREDITS_NOTE } from "@/lib/creditCost";
import { useEffort, effortFor } from "@/lib/effort";
import EffortPicker from "@/components/chat/EffortPicker";

const CODE_SYS = "You are Blackhole Code Assistant. Help with programming. Give clear, correct code with brief explanations.";
const FABLE_SYS = "You are Space, Blackhole AI's premium creative model. Be imaginative and high-quality.";
const AI_NAMES = { ai: "Blackhole AI", code: "Blackhole Code", opus5: "Galaxy", fable: "Space" };
const MODELS = { ai: "automatic", code: "claude_sonnet_4_6", opus5: "claude_opus_4_8", fable: "claude-sonnet-5" };

export default function ChatBox({ conversation, createConversation, addMessage, removeMessage, renameConversation, plan, exhausted, remaining, spend, userInitial }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedAi, setSelectedAi] = useState("ai");
  const [files, setFiles] = useState([]);
  const buildMode = useBuildMode(selectedAi);
  const [effort, setEffort] = useEffort();
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const reqIdRef = useRef(0);
  const convIdRef = useRef(null);

  const messages = conversation?.messages || [];
  const isExhausted = !!exhausted?.[selectedAi];

  const runPrompt = async (text, ai) => {
    let convId = conversation?.id || convIdRef.current;
    const isFirst = !convId || messages.length === 0;
    if (!convId) convId = createConversation();
    convIdRef.current = convId;

    const fileNote = files.length ? `\n[Attached files: ${files.map((f) => f.name).join(", ")}]` : "";
    const sys = ai === "code" ? CODE_SYS : ai === "fable" ? FABLE_SYS : "";
    const intent = ai !== "ai" ? resolveIntent(text, buildMode.mode) : { build: true };
    const modeNote = ai !== "ai" ? (intent.build ? BUILD_NOTE : ANSWER_NOTE) + "\n\n" : "";
    const fullPrompt = `${sys ? sys + "\n\n" : ""}${modeNote}${text}${fileNote}`;
    addMessage(convId, { role: "user", content: text + (files.length ? ` (attached: ${files.map((f) => f.name).join(", ")})` : "") });
    setInput("");
    setLoading(true);
    const myId = ++reqIdRef.current;
    try {
      const eff = effortFor(effort, text, { build: ai !== "ai" && intent.build });
      const res = await base44.functions.invoke("chatCompletion", { prompt: fullPrompt, model: MODELS[ai] || "automatic", effort: eff });
      if (reqIdRef.current !== myId) return;
      // The server charged the credits (cutting the reply off if they ran out); show its new status.
      spend?.[ai]?.(res.data?.credits);
      const content = res.data?.content ?? "";
      addMessage(convId, { role: "ai", content: res.data?.cut ? `${content.trimEnd()}…\n\n${OUT_OF_CREDITS_NOTE}` : content });
      if (isFirst) {
        try {
          const titleRes = await base44.functions.invoke("chatCompletion", {
            prompt: `Create a very short title (max 4 words, no quotes, no trailing punctuation) summarizing what this chat is about based on the user's first message: "${text}". Respond with only the title.`,
            internal: true,
          });
          const title = (titleRes.data?.content ?? "").trim().slice(0, 50);
          if (title && reqIdRef.current === myId) renameConversation(convId, title);
        } catch {}
      }
    } catch (e) {
      if (reqIdRef.current !== myId) return;
      const data = e?.response?.data;
      if (data?.credits) spend?.[ai]?.(data.credits);
      // Out-of-credits and "AI is busy" come back with a message worth showing as-is.
      addMessage(convId, { role: "ai", content: data?.error ? `⚠ ${data.error}` : "Sorry, something went wrong. Please try again." });
    } finally {
      if (reqIdRef.current === myId) {
        setLoading(false);
        q.runNext();
      }
    }
  };

  const q = useMessageQueue({ run: runPrompt, remaining, names: AI_NAMES, selectedAi, onChangeAi: setSelectedAi });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, q.queue.length]);

  useEffect(() => {
    convIdRef.current = conversation?.id || null;
  }, [conversation?.id]);

  const stop = () => {
    reqIdRef.current++;
    setLoading(false);
    const convId = conversation?.id;
    if (convId && messages.length && messages[messages.length - 1].role === "user") {
      removeMessage?.(convId, messages.length - 1);
    }
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
    if (isExhausted) return;
    runPrompt(text, selectedAi);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const queued = loading || q.paused;
  const canSend = input.trim().length > 0 && (queued || !isExhausted);

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
                  Thinking...{q.queue.length > 0 ? ` (${q.queue.length} queued)` : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700/50 p-3">
          <QueueList q={q} loading={loading} />

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
              placeholder={queued ? "Type to queue your next message…" : "Message Blackhole AI..."}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-500 px-4 py-3 max-h-32 text-sm"
            />
            <SendOrStopButton loading={loading} focused={focused} queued={queued} canSend={canSend} onSend={send} onStop={stop} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach images or files"
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <AiChooser value={selectedAi} onChange={setSelectedAi} plan={plan} allowFable={true} />
            <EffortPicker value={effort} onChange={setEffort} />
            {buildMode.visible && <ModeToggle mode={buildMode.mode} onChange={buildMode.setMode} />}
            {isExhausted && (
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