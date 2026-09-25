import React, { useState, useRef, useEffect } from "react";
import { askConfirm } from "@/lib/dialogs";
import Markdown, { CopyButton } from "@/components/chat/Markdown";
import ReadAloud from "@/components/chat/ReadAloud";
import ReportReply from "@/components/chat/ReportReply";
import { Plus, X, Paperclip, RotateCcw, Pencil } from "lucide-react";
import BlackholeIcon from "@/components/BlackholeIcon";
import AiChooser from "@/components/AiChooser";
import QueueList from "@/components/chat/QueueList";
import SendOrStopButton from "@/components/chat/SendOrStopButton";
import useMessageQueue from "@/hooks/useMessageQueue";
import useBuildMode, { BUILD_NOTE, ANSWER_NOTE, resolveIntent } from "@/hooks/useBuildMode";
import ModeToggle from "@/components/chat/ModeToggle";
import { base44 } from "@/api/base44Client";
import { OUT_OF_CREDITS_NOTE } from "@/lib/creditCost";
import { TIER_OF_AI } from "@/lib/creditRefresh";
import OutOfCredits from "@/components/chat/OutOfCredits";
import { useEffort, effortFor } from "@/lib/effort";
import { streamChat } from "@/lib/aiStream";
import { shrinkImage } from "@/lib/siteImages";
import EffortPicker from "@/components/chat/EffortPicker";
import VoiceInput from "@/components/chat/VoiceInput";
import { useAppShell } from "@/components/AppShellContext";
import useStickToBottom from "@/hooks/useStickToBottom";
import { privateInfoIn } from "@/lib/privateInfo";
import { isNetworkError, OFFLINE_NOTE } from "@/lib/netError";
import useReplyAnnouncer from "@/hooks/useReplyAnnouncer";

const CODE_SYS = "You are Blackhole Code Assistant. Help with programming. Give clear, correct code with brief explanations.";
const FABLE_SYS = "You are Space, Blackhole AI's premium creative model. Be imaginative and high-quality.";
const AI_NAMES = { ai: "Blackhole AI", code: "Blackhole Code", opus5: "Galaxy", fable: "Space" };
const MODELS = { ai: "automatic", code: "claude_sonnet_4_6", opus5: "claude_opus_4_8", fable: "claude-sonnet-5" };
// Shown in an empty chat so new people see what they can make right away.
// What people most often come for first: help from the AI; building is one tap away.
const STARTERS = [
  { icon: "📚", label: "Homework help", hint: "Step by step", prompt: "Help me with my homework. Ask me what the question is, then explain it step by step instead of just giving the answer." },
  { icon: "💡", label: "Explain simply", hint: "Like black holes", prompt: "Explain black holes like I'm 10." },
  { icon: "✍️", label: "Help me write", hint: "Essay, email, story", prompt: "Help me write something. Ask me what it's for, who will read it and how long it should be first." },
  { icon: "🧠", label: "Quiz me", hint: "Practise for a test", prompt: "Quiz me to practise for a test. Ask me the topic and my grade first, then give me one question at a time." },
  { icon: "🌐", label: "Build a website", hint: "Templates or your idea", go: "designer" },
  { icon: "🎮", label: "Make a game", hint: "Describe it, then play it", go: "game" },
];

export default function ChatBox({ conversation, createConversation, addMessage, removeMessage, renameConversation, plan, exhausted, remaining, spend, userInitial }) {
  // ?ask=... (from the Ideas page or a guide): the question starts typed in the box, not sent,
  // so nothing is charged until the person presses send. Taken out of the address after.
  const [input, setInput] = useState(() => {
    try {
      return (new URLSearchParams(window.location.search).get("ask") || "").slice(0, 500);
    } catch {
      return "";
    }
  });
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("ask")) return;
    url.searchParams.delete("ask");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, []);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedAi, setSelectedAi] = useState("ai");
  const [files, setFiles] = useState([]);
  const buildMode = useBuildMode(selectedAi);
  const [effort, setEffort] = useEffort();
  const [live, setLive] = useState("");
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const reqIdRef = useRef(0);
  const abortRef = useRef(null);
  const convIdRef = useRef(null);
  const shell = useAppShell();

  const messages = conversation?.messages || [];
  const isExhausted = !!exhausted?.[selectedAi];

  const runPrompt = async (text, ai) => {
    let convId = conversation?.id || convIdRef.current;
    const isFirst = !convId || messages.length === 0;
    if (!convId) convId = createConversation();
    convIdRef.current = convId;

    addMessage(convId, { role: "user", content: text + (files.length ? ` (attached: ${files.map((f) => f.name).join(", ")})` : "") });
    setInput("");
    setLoading(true);
    setLive("");
    const myId = ++reqIdRef.current;
    // Attached images are processed after the busy state is set, so a quick second
    // tap on Send is queued instead of starting a parallel request.
    // Up to 3 attached images go to the AI itself (shrunk first); other files by name.
    const imageFiles = files.filter((f) => /^image\//.test(f.type)).slice(0, 3);
    const otherFiles = files.filter((f) => !imageFiles.includes(f));
    const images = [];
    for (const f of imageFiles) {
      try {
        const dataUrl = await shrinkImage(f, 1280);
        const [, mimeType, data] = dataUrl.match(/^data:([^;]+);base64,(.*)$/) || [];
        if (data) images.push({ mimeType, data });
        else otherFiles.push(f);
      } catch {
        otherFiles.push(f);
      }
    }
    setFiles([]);
    const fileNote = otherFiles.length ? `\n[Attached files (names only): ${otherFiles.map((f) => f.name).join(", ")}]` : "";
    const sys = ai === "code" ? CODE_SYS : ai === "fable" ? FABLE_SYS : "";
    const intent = ai !== "ai" ? resolveIntent(text, buildMode.mode) : { build: true };
    const modeNote = ai !== "ai" ? (intent.build ? BUILD_NOTE : ANSWER_NOTE) + "\n\n" : "";
    const fullPrompt = `${sys ? sys + "\n\n" : ""}${modeNote}${text}${fileNote}`;
    if (reqIdRef.current !== myId) return;
    try {
      const eff = effortFor(effort, text, { build: ai !== "ai" && intent.build });
      // Streamed so the reply appears as it's written.
      // Aborted by Stop, which also ends the reply on the server (see aiStream.js).
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;
      const res = await streamChat({ prompt: fullPrompt, question: text, model: MODELS[ai] || "automatic", effort: eff, ...(images.length ? { images } : {}) }, (soFar) => {
        if (reqIdRef.current === myId) setLive(soFar);
      }, { signal: abort.signal });
      if (reqIdRef.current !== myId) return;
      setLive("");
      // The server charged the credits (cutting the reply off if they ran out); show its new status.
      spend?.[ai]?.(res.credits);
      const content = res.content ?? "";
      addMessage(convId, { role: "ai", content: res.cut ? `${content.trimEnd()}…\n\n${OUT_OF_CREDITS_NOTE}` : content });
      if (isFirst) {
        try {
          const titleRes = await base44.functions.invoke("chatCompletion", {
            prompt: `Create a very short title (max 4 words, no quotes, no trailing punctuation) summarizing what this chat is about based on the user's first message: "${text.slice(0, 500)}". Respond with only the title.`,
            internal: true,
          });
          const title = (titleRes.data?.content ?? "").trim().slice(0, 50);
          if (title && reqIdRef.current === myId) renameConversation(convId, title);
        } catch {}
      }
    } catch (e) {
      if (reqIdRef.current !== myId) return;
      setLive("");
      const data = e?.response?.data;
      if (data?.credits) spend?.[ai]?.(data.credits);
      // Out-of-credits and "AI is busy" come back with a message worth showing as-is.
      addMessage(convId, { role: "ai", content: data?.error ? `⚠ ${data.error}` : isNetworkError(e) ? `⚠ ${OFFLINE_NOTE}` : "Sorry, something went wrong. Please try again." });
    } finally {
      if (reqIdRef.current === myId) {
        setLoading(false);
        q.runNext();
      }
    }
  };

  const q = useMessageQueue({ run: runPrompt, remaining, names: AI_NAMES, selectedAi, onChangeAi: setSelectedAi });

  const sentCount = messages.filter((m) => m.role === "user").length;
  useStickToBottom(scrollRef, [messages, loading, live, q.queue.length], `${conversation?.id}:${sentCount}`);

  useEffect(() => {
    convIdRef.current = conversation?.id || null;
  }, [conversation?.id]);

  const stop = () => {
    reqIdRef.current++;
    abortRef.current?.abort();
    // The server settles the charge for what was written once it notices; re-read credits then.
    setTimeout(() => spend?.[selectedAi]?.(), 2500);
    setLoading(false);
    const convId = conversation?.id;
    // Keep what was already written (it's charged); with nothing written, drop the question.
    if (convId && live.trim()) {
      addMessage(convId, { role: "ai", content: `${live.trimEnd()}\n\n_(stopped)_` });
      setLive("");
    } else if (convId && messages.length && messages[messages.length - 1].role === "user") {
      removeMessage?.(convId, messages.length - 1);
    }
    setInput("");
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    // A card number, secret key, password, phone number or home address: check first (the text
    // stays in the box if not).
    const risky = privateInfoIn(text);
    if (risky && !await askConfirm(`This looks like it has ${risky} in it. It's safer not to share that with the AI (or anyone online). Send it anyway?`)) return;
    if (q.shouldQueue(loading)) {
      q.push(text);
      setInput("");
      if (!loading) q.runNext();
      return;
    }
    if (isExhausted) return;
    runPrompt(text, selectedAi);
  };

  // Ask the last question again: drops the last reply (and the question, which
  // runPrompt adds back) and sends it with the currently selected AI. Attachments
  // aren't kept in the chat, so they aren't resent.
  const retryLast = () => {
    const convId = conversation?.id;
    const n = messages.length;
    if (!convId || loading || n < 2 || messages[n - 1].role !== "ai" || messages[n - 2].role !== "user") return;
    if (isExhausted) return;
    const question = messages[n - 2].content.replace(/ \(attached: [^)]*\)$/, "");
    removeMessage?.(convId, n - 1);
    removeMessage?.(convId, n - 2);
    runPrompt(question, selectedAi);
  };

  // Edit your last question: it goes back into the box (with its answer removed) to fix and
  // send again. Nothing is charged until it's sent.
  const editLast = () => {
    const convId = conversation?.id;
    const n = messages.length;
    if (!convId || loading) return;
    const at = messages[n - 1]?.role === "user" ? n - 1 : messages[n - 2]?.role === "user" ? n - 2 : -1;
    if (at < 0) return;
    const question = messages[at].content.replace(/ \(attached: [^)]*\)$/, "");
    for (let k = n - 1; k >= at; k--) removeMessage?.(convId, k);
    setInput(question);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(question.length, question.length);
      }
    });
  };

  const startWith = (s) => {
    if (s.go === "designer") return shell?.goDesigner();
    // Opens the game maker as it was left (goGameDesigner would start over and clear a draft).
    if (s.go === "game") return shell?.navigate("/chat/game-designer");
    if (loading || isExhausted) return;
    runPrompt(s.prompt, selectedAi);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const queued = loading || q.paused;
  const canSend = input.trim().length > 0 && (queued || !isExhausted);

  const announce = useReplyAnnouncer(messages, loading, conversation?.id);

  return (
    <div className="w-full max-w-3xl px-3 sm:px-4">
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>
      {/* No backdrop blur, smooth scrolling or scroll trapping here: on phones (iPhones especially)
          they got in the way of scrolling the messages. At either end, a swipe scrolls the page. */}
      <div className="bg-slate-900/80 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">
        <div ref={scrollRef} className="h-[55vh] sm:h-96 overflow-y-auto overscroll-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="keep-color w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center mb-3">
                <BlackholeIcon className="w-7 h-7" />
              </div>
              <p className="text-slate-300 font-medium">Ask me anything</p>
              <p className="text-slate-500 text-sm mt-1">or try one of these</p>
              <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-md">
                {STARTERS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => startWith(s)}
                    className="text-left px-3 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50 hover:bg-slate-700/70 hover:border-indigo-500/50 transition-colors"
                  >
                    <span className="block text-sm text-slate-200 font-medium">
                      <span aria-hidden="true">{s.icon}</span> {s.label}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">{s.hint}</span>
                  </button>
                ))}
              </div>
              <a href="/ideas" className="mt-3 text-xs text-indigo-300 hover:text-indigo-200 underline underline-offset-2">
                More ideas for what to ask
              </a>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] min-w-0 px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "whitespace-pre-wrap bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm"
                    : "bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/50"
                }`}
              >
                {m.role === "user" ? (
                  m.content
                ) : (
                  <>
                    <Markdown text={m.content} />
                    <div className="flex flex-wrap justify-end gap-1 mt-1 -mb-1">
                      {i === messages.length - 1 && !loading && !isExhausted && (
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
                      <ReadAloud text={m.content} />
                      <CopyButton getText={() => m.content} label="Copy reply" className="p-1 rounded-md text-slate-500 hover:text-slate-200" />
                      <ReportReply question={messages[i - 1]?.role === "user" ? messages[i - 1].content : ""} reply={m.content} />
                    </div>
                  </>
                )}
              </div>
              {m.role === "user" && !loading && (i === messages.length - 1 || i === messages.length - 2) && (
                <button
                  type="button"
                  onClick={editLast}
                  title="Edit this message"
                  aria-label="Edit this message"
                  className="order-first self-center p-1 rounded-md text-slate-500 hover:text-slate-200"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {m.role === "user" && (
                <div className="keep-color w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {userInitial || "U"}
                </div>
              )}
            </div>
          ))}

          {loading && live && (
            <div className="flex justify-start">
              <div className="max-w-[80%] min-w-0 px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-slate-800 text-slate-100 border border-slate-700/50">
                <Markdown text={live} />
                <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-indigo-400 animate-pulse" />
              </div>
            </div>
          )}

          {loading && !live && (
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
          {isExhausted && !loading && <OutOfCredits tier={TIER_OF_AI[selectedAi]} />}
          <div className="flex items-end gap-2 bg-slate-800/70 rounded-2xl border border-slate-700/50 focus-within:border-indigo-500/50 transition-colors">
            <textarea
              ref={inputRef}
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
            <VoiceInput onText={(t) => setInput((cur) => (cur.trim() ? `${cur.trimEnd()} ${t}` : t))} />
            <AiChooser value={selectedAi} onChange={setSelectedAi} plan={plan} allowFable={true} />
            <EffortPicker value={effort} onChange={setEffort} />
            {buildMode.visible && <ModeToggle mode={buildMode.mode} onChange={buildMode.setMode} />}
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
          <p className="text-center text-xs text-slate-600 mt-2">Blackhole AI can make mistakes. Check important info, and never share passwords or card numbers with it.</p>
        </div>
      </div>
    </div>
  );
}