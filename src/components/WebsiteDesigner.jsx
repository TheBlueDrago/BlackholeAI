import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Globe, Search, RefreshCw, Plus, X, Crown, Rocket, Paperclip, Square } from "lucide-react";
import BlackholeIcon from "@/components/BlackholeIcon";
import { base44 } from "@/api/base44Client";
import AiChooser from "@/components/AiChooser";
import SheetSelect from "@/components/SheetSelect";
import ThemeToggle from "@/components/ThemeToggle";

const STORE_KEY = "infinity-ai-designer";
const TAKEN_KEY = "infinity-ai-taken-sites";
const MODEL = "claude_sonnet_4_6";

const RESERVED = ["home", "www", "admin", "api", "mail", "infinity", "ai", "app", "login", "register", "support", "blog"];

const SYSTEM = `You are Blackhole AI Website Designer. The user describes a website and you build it.
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

function detectPages(html) {
  const paths = new Set(["/home"]);
  if (html) {
    const re = /href=["'](\/[a-z0-9][a-z0-9-]*)["']/gi;
    let m;
    while ((m = re.exec(html))) paths.add(m[1]);
  }
  return Array.from(paths).sort();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { siteName: p.siteName || p.name || "my-site", messages: p.messages || [], members: p.members || [], projectId: p.projectId || genId() };
    }
  } catch {}
  return { siteName: "my-site", messages: [], members: [], projectId: genId() };
}

function genId() {
  return (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
}

function getTaken() {
  try {
    return JSON.parse(localStorage.getItem(TAKEN_KEY) || "[]");
  } catch {
    return [];
  }
}

function ownerOf(n) {
  return getTaken().find((e) => e.name === n)?.projectId;
}

function isTakenFor(n, projectId) {
  if (!n || RESERVED.includes(n)) return true;
  const o = ownerOf(n);
  return !!o && o !== projectId;
}

function suggestNames(n, projectId) {
  const base = n || "my-site";
  const out = [];
  let i = 1;
  while (out.length < 3 && i < 30) {
    const c = `${base}-${i}`;
    if (!isTakenFor(c, projectId)) out.push(c);
    i++;
  }
  return out;
}

function sanitizeSite(s) {
  return s.toLowerCase().replace(/[^a-z-]+/g, "-").replace(/^-+|-+$/g, "");
}

function capFor(plan) {
  if (plan === "secret") return 5;
  if (plan === "team" || plan === "pro") return 3;
  return 2;
}

function initialOf(s) {
  return (s || "?").trim().charAt(0).toUpperCase();
}

export default function WebsiteDesigner({ onToggleSidebar, onOpenProfile, onUpgrade, aiExhausted, onSpendAI, aiCodeExhausted, onSpendAICode, galaxy5Exhausted, onSpendGalaxy5, space5Exhausted, onSpendSpace5, plan, lightMode, onToggleLight }) {
  const initial = loadState();
  const projectId = initial.projectId;
  const [siteName, setSiteName] = useState(initial.siteName);
  const [messages, setMessages] = useState(initial.messages);
  const [members, setMembers] = useState(initial.members);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [pagePath, setPagePath] = useState("/home");
  const [previewMode, setPreviewMode] = useState("preview");
  const [reloadKey, setReloadKey] = useState(0);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteErr, setInviteErr] = useState("");
  const [showPublish, setShowPublish] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishErr, setPublishErr] = useState("");
  const [publishUrl, setPublishUrl] = useState("");
  const opusAllowed = plan === "pro" || plan === "team" || plan === "secret" || plan === "admin";
  const fableAllowed = plan === "team" || plan === "secret" || plan === "admin";
  const [selectedAi, setSelectedAi] = useState(fableAllowed ? "fable" : opusAllowed ? "opus5" : "ai");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const reqIdRef = useRef(0);
  const lastTextRef = useRef("");

  const lastAi = [...messages].reverse().find((m) => m.role === "ai");
  const previewHtml = lastAi ? extractHtml(lastAi.content) : "";

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ siteName, messages, members, projectId }));
    } catch {}
  }, [siteName, messages, members]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const effPlan = plan;
  const cap = capFor(plan);
  const ownerInitial = initialOf(user?.full_name || user?.email || "U");
  const canAdd = members.length < cap - 1;

  const isCodeAi = selectedAi === "code";
  const isGalaxy = selectedAi === "opus5";
  const isSpace = selectedAi === "fable";
  const sendExhausted = isCodeAi ? aiCodeExhausted : isGalaxy ? galaxy5Exhausted : isSpace ? space5Exhausted : aiExhausted;

  const stop = () => {
    reqIdRef.current++;
    setLoading(false);
    setInput("");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || sendExhausted) return;
    const fileNote = files.length ? `\n[Attached files: ${files.map((f) => f.name).join(", ")}]` : "";
    const userMsg = { role: "user", content: text + (files.length ? ` (attached: ${files.map((f) => f.name).join(", ")})` : "") };
    setMessages((prev) => [...prev, userMsg]);
    lastTextRef.current = text;
    setInput("");
    setLoading(true);
    const myId = ++reqIdRef.current;
    (isCodeAi ? onSpendAICode : isGalaxy ? onSpendGalaxy5 : isSpace ? onSpendSpace5 : onSpendAI)?.();
    try {
      const lastHtml = messages.filter((m) => m.role === "ai").pop()?.content || "";
      const userTurns = messages.filter((m) => m.role === "user").map((m) => m.content);
      const prompt =
        `${SYSTEM}\n\n` +
        (lastHtml ? `Current website HTML:\n${lastHtml}\n\n` : "") +
        `Requests so far:\n${userTurns.length ? userTurns.map((u, i) => `${i + 1}. ${u}`).join("\n") : "(none)"}\n\n` +
        `Latest request: ${text}${fileNote}\n\nOutput the complete updated HTML document now.`;
      const model = { ai: "automatic", code: MODEL, opus5: "claude_opus_4_8", fable: "claude-sonnet-5" }[selectedAi] || "automatic";
      const res = await base44.functions.invoke("chatCompletion", { prompt, model });
      if (reqIdRef.current !== myId) return;
      const content = res.data?.content ?? "";
      setMessages((prev) => [...prev, { role: "ai", content }]);
    } catch {
      if (reqIdRef.current !== myId) return;
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Sorry, something went wrong generating your website. Please try again." },
      ]);
    } finally {
      if (reqIdRef.current === myId) setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const addMember = () => {
    const e = inviteEmail.trim().toLowerCase();
    if (!e) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setInviteErr("Enter a valid email.");
      return;
    }
    if (members.includes(e)) {
      setInviteErr("Already added.");
      return;
    }
    if (!canAdd) {
      setInviteErr(`Your ${effPlan} plan allows ${cap} people total (including you).`);
      return;
    }
    setMembers((m) => [...m, e]);
    setInviteEmail("");
    setInviteErr("");
    setShowInvite(false);
  };

  const confirmPublish = async () => {
    const n = sanitizeSite(siteName).toLowerCase();
    if (!n) { setPublishErr("Enter a website name."); return; }
    if (!previewHtml) { setPublishErr("Generate a website first."); return; }
    setPublishErr("");
    setPublishing(true);
    try {
      const existing = await base44.entities.PublishedSite.filter({ name: n });
      const mine = existing.find((s) => s.created_by_id === user?.id);
      if (existing.length && !mine) {
        setPublishErr("That name is taken. Try another.");
        return;
      }
      const ownerName = user?.email || user?.full_name || "";
      if (mine) {
        await base44.entities.PublishedSite.update(mine.id, { html: previewHtml, ownerName });
      } else {
        await base44.entities.PublishedSite.create({ name: n, html: previewHtml, ownerName });
      }
      const list = getTaken().filter((e) => e.name !== n);
      list.push({ name: n, projectId });
      localStorage.setItem(TAKEN_KEY, JSON.stringify(list));
      setPublishUrl(`${window.location.origin}/site/${n}`);
      setShowPublish(false);
      setPublished(true);
      setTimeout(() => setPublished(false), 2500);
    } catch (e) {
      setPublishErr(e?.response?.data?.error || e?.message || "Could not publish.");
    } finally {
      setPublishing(false);
    }
  };

  const reload = () => setReloadKey((k) => k + 1);

  const taken = isTakenFor(siteName, projectId);
  const pages = detectPages(previewHtml);
  const safePagePath = pages.includes(pagePath) ? pagePath : pages[0];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden">
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]" />

      {/* Top bar */}
      <header className="relative z-20 flex items-center gap-2 sm:gap-3 h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] px-3 sm:px-4 border-b border-slate-700/50 bg-slate-900/70 backdrop-blur-xl">
        <button onClick={onToggleSidebar} title="Menu" className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0">
          <div className="keep-color w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
            <BlackholeIcon className="w-5 h-5" />
          </div>
        </button>
        <span className="h-6 w-px bg-slate-700 shrink-0" />
        <button
          onClick={onOpenProfile}
          title="Account"
          className="keep-color w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white hover:opacity-90 transition-opacity shrink-0"
        >
          {ownerInitial}
        </button>
        <span className="h-6 w-px bg-slate-500/60 shrink-0" />
        <ThemeToggle light={lightMode} onToggle={onToggleLight} />
        <input
          value={siteName}
          onChange={(e) => setSiteName(sanitizeSite(e.target.value))}
          placeholder="my-site"
          title="Website name (letters and hyphens only)"
          className="bg-slate-800/70 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-indigo-500/50 w-28 sm:w-40 font-medium shrink-0"
        />

        {/* Page path / search bar */}
        <div className="flex-1 flex justify-center px-2 min-w-0">
          <div className="flex items-center w-full max-w-md bg-slate-800/70 rounded-lg border border-slate-700/50 focus-within:border-indigo-500/50 transition-colors">
            <Search className="w-4 h-4 text-slate-500 ml-2.5 shrink-0" />
            <SheetSelect
              value={safePagePath}
              onChange={(v) => { setPagePath(v); reload(); }}
              options={pages.map((p) => ({ value: p, label: p }))}
              className="flex-1 bg-transparent outline-none text-slate-200 px-2 py-1.5 text-sm min-w-0"
            />
            <button
              onClick={reload}
              title="Reload preview"
              className="p-1.5 mr-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center -space-x-2">
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-900"
              title="You"
            >
              {ownerInitial}
            </div>
            {members.map((m, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 ring-2 ring-slate-900"
                title={m}
              >
                {initialOf(m)}
              </div>
            ))}
            {canAdd && (
              <button
                onClick={() => setShowInvite((s) => !s)}
                title="Invite people"
                className="w-8 h-8 rounded-full bg-slate-800 border border-dashed border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:border-indigo-500 ring-2 ring-slate-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={onUpgrade}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Crown className="w-4 h-4" /> Upgrade
          </button>
          <button
            onClick={() => setShowPublish(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-400 transition-colors"
          >
            <Rocket className="w-4 h-4" /> Publish
          </button>
        </div>
      </header>

      {/* Invite popover */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-4 top-16 z-30 w-72 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-white">Invite to project</p>
              <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              {effPlan} plan · {cap} people max (incl. you) · {members.length + 1}/{cap} used
            </p>
            <div className="flex items-center gap-2">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addMember();
                }}
                placeholder="email@example.com"
                className="flex-1 bg-slate-800/70 border border-slate-700/50 rounded-lg px-2.5 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={addMember}
                className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-400 transition-colors"
              >
                Add
              </button>
            </div>
            {inviteErr && <p className="text-xs text-red-400 mt-2">{inviteErr}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body */}
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
                <p className="text-slate-500 text-sm mt-1">Blackhole AI will build it live</p>
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
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700/50 rounded-lg px-2 py-1 text-xs text-slate-200">
                    <Paperclip className="w-3 h-3 text-slate-400" />
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <button onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 bg-slate-800/70 rounded-2xl border border-slate-700/50 focus-within:border-sky-500/50 transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the website you want..."
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-500 px-4 py-3 max-h-32 text-sm"
              />
              {loading ? (
                <button
                  onClick={stop}
                  className="m-1.5 p-2.5 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors"
                  title="Stop generating"
                >
                  <Square className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={send}
                  disabled={!input.trim() || sendExhausted}
                  className="m-1.5 p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
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
              <AiChooser value={selectedAi} onChange={setSelectedAi} plan={plan} allowFable={true} />
              {sendExhausted && (
                <p className="text-xs text-red-400 ml-auto">
                  You're out of {isCodeAi ? "Blackhole Code" : isGalaxy ? "Galaxy 5" : isSpace ? "Space 5" : "Blackhole AI"} credits. Switch AI or upgrade.
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
          </div>
        </section>

        {/* Preview / Dashboard */}
        <section className="md:flex-1 w-full md:h-full h-[55%] flex flex-col bg-slate-950">
          <div className="flex items-center gap-1 px-3 h-10 border-b border-slate-700/50 bg-slate-900/60">
            <button
              onClick={() => setPreviewMode("preview")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                previewMode === "preview" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setPreviewMode("dashboard")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                previewMode === "dashboard" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Dashboard
            </button>
          </div>

          <div className="flex-1 relative overflow-hidden bg-white">
            {previewMode === "dashboard" ? (
              <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto">
                <h2 className="text-lg font-semibold text-white">{siteName}</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Plan: <span className="text-slate-200 capitalize">{effPlan}</span>
                </p>
                <div className="mt-5">
                  <p className="text-slate-300 text-sm font-medium mb-3">
                    People ({members.length + 1}/{cap})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 bg-slate-800 rounded-full pl-1 pr-3 py-1">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
                        {ownerInitial}
                      </div>
                      <span className="text-slate-200 text-xs">{user?.email || "You"}</span>
                    </div>
                    {members.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-800 rounded-full pl-1 pr-3 py-1">
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                          {initialOf(m)}
                        </div>
                        <span className="text-slate-200 text-xs">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : previewHtml ? (
              <iframe
                key={reloadKey}
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
          </div>
        </section>
      </div>

      {/* Publish dialog */}
      <AnimatePresence>
        {showPublish && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPublish(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white">Publish your website</h3>
              <p className="text-slate-400 text-sm mt-1">Your website will be live at:</p>
              <div className="mt-3 flex items-center gap-2 bg-slate-800/70 border border-slate-700/50 rounded-xl px-3 py-2.5">
                <Globe className="w-4 h-4 text-sky-300 shrink-0" />
                <span className="text-slate-100 text-sm font-mono truncate">
                  {window.location.origin}/site/{sanitizeSite(siteName || "your-site")}
                </span>
              </div>

              {taken && (
                <div className="mt-3">
                  <p className="text-amber-300 text-xs">
                    That name is taken. Try one of these:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {suggestNames(siteName || "my-site", projectId).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSiteName(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700/50 text-slate-200 text-xs hover:bg-slate-700 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowPublish(false)}
                  className="flex-1 py-2.5 rounded-xl bg-black text-white font-medium hover:bg-slate-900 border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPublish}
                  disabled={!siteName || publishing || !previewHtml}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {publishing ? "Publishing…" : "Publish"}
                </button>
              </div>
              {publishErr && <p className="text-sm text-red-400 mt-3">{publishErr}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish toast */}
      <AnimatePresence>
        {published && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 z-50 bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium"
          >
            <Rocket className="w-4 h-4" /> Website published!
            {publishUrl && (
              <a href={publishUrl} target="_blank" rel="noreferrer" className="underline ml-1">View</a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}