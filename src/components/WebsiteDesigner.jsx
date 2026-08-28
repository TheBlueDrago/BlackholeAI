import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, Globe, User } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STORE_KEY = "infinity-ai-designer";
const MODEL = "claude_sonnet_4_6";

const SYSTEM = `You are Infinity AI Website Designer. The user describes a website and you build it.
ALWAYS respond with a single complete, self-contained HTML document: include <!DOCTYPE html>, <html>, <head> with inline <style> CSS, and <body> with inline <script> for any interactivity.
Make it modern, responsive, and visually polished — clean typography, good spacing, a tasteful color palette, and smooth interactions. Use placeholder content that fits the site's purpose.
Do NOT wrap the HTML in markdown code fences. Do NOT add any explanation before or after the HTML — output ONLY the raw HTML document.
When the user asks for changes, output the FULL updated HTML document every time, not just the diff.`;

function extractHtml(text) {
  if (!text) return "";
  const fence = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  return text.trim();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: "Untitled Project", messages: [] };
}

export default function WebsiteDesigner({ onToggleSidebar, onOpenProfile, aiExhausted, onSpendAI }) {
  const initial = loadState();
  const [projectName, setProjectName] = useState(initial.name);
  const [messages, setMessages] = useState(initial.messages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const lastAi = [...messages].reverse().find((m) => m.role === "ai");
  const previewHtml = lastAi ? extractHtml(lastAi.content) : "";

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ name: projectName, messages }));
    } catch {}
  }, [projectName, messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || aiExhausted) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    onSpendAI?.();

    try {
      const lastHtml = messages.filter((m) => m.role === "ai").pop()?.content || "";
      const userTurns = messages.filter((m) => m.role === "user").map((m) => m.content);
      const prompt =
        `${SYSTEM}\n\n` +
        (lastHtml ? `Current website HTML:\n${lastHtml}\n\n` : "") +
        `Requests so far:\n${userTurns.length ? userTurns.map((u, i) => `${i + 1}. ${u}`).join("\n") : "(none)"}\n\n` +
        `Latest request: ${text}\n\nOutput the complete updated HTML document now.`;

      const res = await base44.functions.invoke("chatCompletion", { prompt, model: MODEL });
      const content = res.data?.content ?? "";
      setMessages((prev) => [...prev, { role: "ai", content }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Sorry, something went wrong generating your website. Please try again." },
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
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden">
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center gap-3 h-14 px-4 border-b border-slate-700/50 bg-slate-900/70 backdrop-blur-xl">
        <button
          onClick={onToggleSidebar}
          title="Menu"
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </button>
        <span className="h-6 w-px bg-slate-700" />
        <button
          onClick={onOpenProfile}
          title="Account"
          className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <User className="w-5 h-5" />
        </button>
        <span className="h-6 w-px bg-slate-700" />
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="w-5 h-5 text-sky-300 shrink-0" />
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Untitled Project"
            className="bg-transparent text-sm font-medium text-white outline-none w-44 max-w-[40vw] border-b border-transparent focus:border-indigo-500/60 transition-colors"
          />
        </div>
      </header>

      {/* Body: chat + preview */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Chat */}
        <section className="md:w-[40%] w-full md:h-full h-[45%] flex flex-col border-b md:border-b-0 md:border-r border-slate-700/50 bg-slate-900/40">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
            {messages.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center mb-3">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <p className="text-slate-300 font-medium">Describe your website</p>
                <p className="text-slate-500 text-sm mt-1">Infinity AI will build it live</p>
              </div>
            )}

            {messages.map((m, i) => {
              if (m.role === "user") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-sm">
                      {m.content}
                    </div>
                  </div>
                );
              }
              const isHtml = /<[a-z!][\s\S]*>/i.test(m.content);
              return (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-slate-800 text-slate-100 border border-slate-700/50 text-sm">
                    {isHtml ? (
                      <span className="text-emerald-300 font-medium">✓ Website updated</span>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-700/50">
            <div className="flex items-end gap-2 bg-slate-800/70 rounded-2xl border border-slate-700/50 focus-within:border-sky-500/50 transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the website you want..."
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-500 px-4 py-3 max-h-32 text-sm"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading || aiExhausted}
                className="m-1.5 p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {aiExhausted && (
              <p className="text-center text-xs text-red-400 mt-2">You're out of AI credits.</p>
            )}
          </div>
        </section>

        {/* Preview */}
        <section className="md:flex-1 w-full md:h-full h-[55%] bg-white relative overflow-hidden">
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              title="Website preview"
              sandbox="allow-scripts"
              className="w-full h-full bg-white"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center mb-3">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <p className="text-slate-300 font-medium">Your website preview will appear here</p>
              <p className="text-slate-500 text-sm mt-1">Describe what you want to build in the chat</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}