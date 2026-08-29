import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, Plus, X, Paperclip } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CODE_SYS = "You are Infinity AI Code Assistant. Help with programming. Give clear, correct code with brief explanations.";
const FABLE_SYS = "You are Fable 5, Infinity AI's premium creative model. Be imaginative and high-quality.";

export default function ChatBox({ conversation, createConversation, addMessage, renameConversation, plan, aiExhausted, aiCodeExhausted, onSpendAI, onSpendAICode }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAi, setSelectedAi] = useState("ai");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const messages = conversation?.messages || [];
  const isCodeAi = selectedAi === "code";
  const exhausted = isCodeAi ? aiCodeExhausted : aiExhausted;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || exhausted) return;

    let convId = conversation?.id;
    const isFirst = !convId || messages.length === 0;
    if (!convId) convId = createConversation();

    const fileNote = files.length ? `\n[Attached files: ${files.map((f) => f.name).join(", ")}]` : "";
    const sysPrefix = selectedAi === "code" ? CODE_SYS : selectedAi === "fable" ? FABLE_SYS : "";
    const fullPrompt = `${sysPrefix ? sysPrefix + "\n\n" : ""}${text}${fileNote}`;
    addMessage(convId, { role: "user", content: text + (files.length ? ` (attached: ${files.map((f) => f.name).join(", ")})` : "") });
    setInput("");
    setLoading(true);
    (isCodeAi ? onSpendAICode : onSpendAI)?.();
    try {
      const model = selectedAi === "ai" ? "automatic" : "claude_sonnet_4_6";
      const res = await base44.functions.invoke("chatCompletion", { prompt: fullPrompt, model });
      const content = res.data?.content ?? "";
      addMessage(convId, { role: "ai", content });

      if (isFirst) {
        try {
          const titleRes = await base44.functions.invoke("chatCompletion", {
            prompt: `Create a very short title (max 4 words, no quotes, no trailing punctuation) summarizing what this chat is about based on the user's first message: "${text}". Respond with only the title.`,
          });
          const title = (titleRes.data?.content ?? "").trim().slice(0, 50);
          if (title) renameConversation(convId, title);
        } catch {}
      }
    } catch {
      addMessage(convId, { role: "ai", content: "Sorry, something went wrong. Please try again." });
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
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">
        <div ref={scrollRef} className="h-[55vh] sm:h-96 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="keep-color w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-slate-300 font-medium">Ask me anything</p>
              <p className="text-slate-500 text-sm mt-1">Infinity AI is ready to help</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm"
                    : "bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/50"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-bl-sm">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700/50 p-3">
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
              placeholder="Message Infinity AI..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-500 px-4 py-3 max-h-32 text-sm"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading || exhausted}
              className="m-1.5 p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
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
          <p className="text-center text-xs text-slate-600 mt-2">Infinity AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
}