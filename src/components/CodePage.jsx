import React, { useState, useRef } from "react";
import Markdown, { CopyButton } from "@/components/chat/Markdown";
import { Terminal, RotateCcw } from "lucide-react";
import { OUT_OF_CREDITS_NOTE } from "@/lib/creditCost";
import OutOfCredits from "@/components/chat/OutOfCredits";
import { useEffort, effortFor } from "@/lib/effort";
import { streamChat } from "@/lib/aiStream";
import EffortPicker from "@/components/chat/EffortPicker";
import BlackholeIcon from "@/components/BlackholeIcon";
import QueueList from "@/components/chat/QueueList";
import SendOrStopButton from "@/components/chat/SendOrStopButton";
import useMessageQueue from "@/hooks/useMessageQueue";
import useBuildMode, { BUILD_NOTE, ANSWER_NOTE, resolveIntent } from "@/hooks/useBuildMode";
import ModeToggle from "@/components/chat/ModeToggle";
import useStickToBottom from "@/hooks/useStickToBottom";

export default function CodePage({ aiCodeExhausted, aiCodeRemaining, onSpendAICode, userInitial }) {
  const buildMode = useBuildMode("code");
  const [effort, setEffort] = useEffort();
  const [live, setLive] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const scrollRef = useRef(null);
  const reqIdRef = useRef(0);
  const abortRef = useRef(null);

  const runPrompt = async (text) => {
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setLive("");
    const myId = ++reqIdRef.current;
    const intent = resolveIntent(text, buildMode.mode);
    try {
      const modeNote = intent.build ? BUILD_NOTE : ANSWER_NOTE;
      const eff = effortFor(effort, text, { build: intent.build });
      // Streamed so the reply appears as it's written.
      // Aborted by Stop, which also ends the reply on the server (see aiStream.js).
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;
      const res = await streamChat({ prompt: `${modeNote}\n\n${text}`, question: text, model: "claude_sonnet_4_6", effort: eff }, (soFar) => {
        if (reqIdRef.current === myId) setLive(soFar);
      }, { signal: abort.signal });
      if (reqIdRef.current !== myId) return;
      setLive("");
      // The server charged the credits (cutting the reply off if they ran out); show its new status.
      onSpendAICode?.(res.credits);
      const content = res.content ?? "";
      setMessages((m) => [...m, { role: "ai", content: res.cut ? `${content.trimEnd()}…\n\n${OUT_OF_CREDITS_NOTE}` : content }]);
    } catch (e) {
      if (reqIdRef.current !== myId) return;
      setLive("");
      const data = e?.response?.data;
      if (data?.credits) onSpendAICode?.(data.credits);
      setMessages((m) => [...m, { role: "ai", content: data?.error ? `⚠ ${data.error}` : "Sorry, something went wrong. Please try again." }]);
    } finally {
      if (reqIdRef.current === myId) {
        setLoading(false);
        q.runNext();
      }
    }
  };

  const q = useMessageQueue({ run: runPrompt, remaining: { code: aiCodeRemaining ?? (aiCodeExhausted ? 0 : Infinity) }, names: { code: "Blackhole Code" }, selectedAi: "code" });

  useStickToBottom(scrollRef, [messages, loading, live, q.queue.length], messages.filter((m) => m.role === "user").length);

  const stop = () => {
    reqIdRef.current++;
    abortRef.current?.abort();
    // The server settles the charge for what was written once it notices; re-read credits then.
    setTimeout(() => onSpendAICode?.(), 2500);
    setLoading(false);
    setInput("");
    // Keep what was already written (it's charged).
    if (live.trim()) {
      setMessages((m) => [...m, { role: "ai", content: `${live.trimEnd()}\n\n_(stopped)_` }]);
      setLive("");
    }
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

  // Ask the last question again, replacing the last reply.
  const retryLast = () => {
    const n = messages.length;
    if (loading || aiCodeExhausted || n < 2 || messages[n - 1].role !== "ai" || messages[n - 2].role !== "user") return;
    const question = messages[n - 2].content;
    setMessages((m) => m.slice(0, -2));
    runPrompt(question);
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
      {/* Same as the home chat: no blur, smooth scrolling or scroll trapping, for phones. */}
      <div className="bg-slate-900/80 border border-emerald-700/40 rounded-3xl overflow-hidden shadow-2xl">
        <div ref={scrollRef} className="h-[55vh] sm:h-96 overflow-y-auto overscroll-y-auto p-4 sm:p-6 space-y-4">
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
                className={`max-w-[80%] min-w-0 px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "whitespace-pre-wrap bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-sm"
                    : "bg-slate-800 text-slate-100 rounded-bl-sm border border-emerald-700/40"
                }`}
              >
                {m.role === "user" ? (
                  m.content
                ) : (
                  <>
                    <Markdown text={m.content} />
                    <div className="flex justify-end gap-1 mt-1 -mb-1">
                      {i === messages.length - 1 && !loading && !aiCodeExhausted && (
                        <button
                          type="button"
                          onClick={retryLast}
                          title="Try again (uses credits)"
                          aria-label="Try again"
                          className="p-1 rounded-md text-slate-500 hover:text-slate-200"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <CopyButton getText={() => m.content} label="Copy reply" className="p-1 rounded-md text-slate-500 hover:text-slate-200" />
                    </div>
                  </>
                )}
              </div>
              {m.role === "user" && (
                <div className="keep-color w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {userInitial || "U"}
                </div>
              )}
            </div>
          ))}

          {loading && live && (
            <div className="flex justify-start">
              <div className="max-w-[80%] min-w-0 px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-slate-800 text-slate-100 border border-emerald-700/40">
                <Markdown text={live} />
                <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-emerald-400 animate-pulse" />
              </div>
            </div>
          )}

          {loading && !live && (
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
          {aiCodeExhausted && !loading && <OutOfCredits tier="aiCode" canSwitch={false} />}
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
            <EffortPicker value={effort} onChange={setEffort} />
            <ModeToggle mode={buildMode.mode} onChange={buildMode.setMode} />
          </div>
          <p className="text-center text-xs text-slate-600 mt-2">Blackhole AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
}