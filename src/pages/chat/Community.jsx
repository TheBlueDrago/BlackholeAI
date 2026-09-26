import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Hash, Users, UserPlus, Settings, Send, Smile, Reply, Pencil, Trash2, Flag, X, Menu, ArrowLeft, Gift, Check, Ban, MessageCircle, ShoppingBag, Loader2, Sparkles } from "lucide-react";
import { chatApi, connectChat, onChatEvent, sendTyping, addNotification } from "@/lib/nebuluxChat";
import { askConfirm } from "@/lib/dialogs";
import NotificationBell from "@/components/NotificationBell";
import { useAppShell } from "@/components/AppShellContext";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👀"];
const FRAME = {
  glow: "ring-2 ring-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.9)]",
  stars: "ring-2 ring-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.8)]",
  fire: "ring-2 ring-orange-500 shadow-[0_0_14px_rgba(249,115,22,0.95)]",
};

function Avatar({ user, size = 40, online }) {
  if (!user) return null;
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className={`keep-color w-full h-full rounded-full flex items-center justify-center select-none ${FRAME[user.frame] || ""}`}
        style={{ background: user.avatarBg || "#6366f1", fontSize: size * 0.5 }}
      >
        {user.avatar || "🌌"}
      </span>
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[3px] border-[#2b2d31] ${online ? "bg-emerald-500" : "bg-slate-500"}`} />
      )}
    </span>
  );
}

const Name = ({ user, className = "" }) => (
  <span className={`font-semibold ${className}`} style={{ color: user?.nameColor || "#e2e8f0" }}>
    {user?.name}
    {user?.badge ? <span className="ml-1">{user.badge}</span> : null}
    {user?.admin ? <span className="ml-1.5 align-middle rounded bg-indigo-600 px-1 text-[10px] font-bold text-[#fff]">STAFF</span> : null}
  </span>
);

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const day = (iso) => new Date(iso).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });

export default function Community() {
  const navigate = useNavigate();
  const shell = useAppShell();
  const [params, setParams] = useSearchParams();
  const [me, setMe] = useState(null);
  const [orbs, setOrbs] = useState(0);
  const [meta, setMeta] = useState(null);
  const [channels, setChannels] = useState([]);
  const [dms, setDms] = useState([]);
  const [view, setView] = useState(params.get("tab") === "friends" ? "friends" : "server");
  const [channel, setChannel] = useState(params.get("c") || "general");
  const [messages, setMessages] = useState([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [typing, setTyping] = useState({});
  const [people, setPeople] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [notice, setNotice] = useState("");
  const listRef = useRef(null);
  const typingSent = useRef(0);
  const channelRef = useRef(channel);
  channelRef.current = channel;

  const flash = (m) => {
    setNotice(m);
    setTimeout(() => setNotice(""), 3500);
  };

  const loadMe = useCallback(() => chatApi("/me").then((r) => {
    setMe(r.me);
    setOrbs(r.orbs);
    setMeta(r);
  }), []);
  const loadChannels = useCallback(() => chatApi("/channels").then((r) => {
    setChannels(r.channels || []);
    setDms(r.dms || []);
  }), []);
  const loadPeople = useCallback(() => chatApi("/people").then((r) => setPeople(r.people || [])).catch(() => {}), []);

  useEffect(() => {
    connectChat();
    Promise.all([loadMe(), loadChannels(), loadPeople()])
      .catch((e) => setError(e.status === 401 ? "Sign in to use Nebulux Chat." : e.message))
      .finally(() => setLoading(false));
    const t = setInterval(loadPeople, 30000);
    return () => clearInterval(t);
  }, [loadMe, loadChannels, loadPeople]);

  const openChannel = useCallback(
    (id) => {
      setView("server");
      setChannel(id);
      setDrawer(false);
      setReplyTo(null);
      setEditing(null);
      setParams(id === "general" ? {} : { c: id }, { replace: true });
    },
    [setParams]
  );

  useEffect(() => {
    if (view !== "server" || !me) return;
    let alive = true;
    setMessages([]);
    chatApi(`/channels/${encodeURIComponent(channel)}/messages`)
      .then((r) => {
        if (!alive) return;
        setMessages(r.messages || []);
        setMore(!!r.more);
        setChannels((cs) => cs.map((c) => (c.id === channel ? { ...c, unread: false } : c)));
        setDms((ds) => ds.map((c) => (c.id === channel ? { ...c, unread: false } : c)));
        requestAnimationFrame(() => listRef.current && (listRef.current.scrollTop = listRef.current.scrollHeight));
      })
      .catch((e) => alive && flash(e.message));
    return () => {
      alive = false;
    };
  }, [channel, view, me]);

  // Live events
  useEffect(
    () =>
      onChatEvent((e) => {
        if (e.type === "message") {
          const m = e.message;
          if (m.channel === channelRef.current) {
            setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
            const el = listRef.current;
            if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 200) requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
            setTyping((t) => ({ ...t, [m.user.id]: undefined }));
          } else {
            setChannels((cs) => cs.map((c) => (c.id === m.channel ? { ...c, unread: true } : c)));
            if (m.channel.startsWith("dm:")) loadChannels();
          }
        } else if (e.type === "edit") setMessages((cur) => cur.map((x) => (x.id === e.id ? { ...x, text: e.text, edited: true } : x)));
        else if (e.type === "delete") setMessages((cur) => cur.map((x) => (x.id === e.id ? { ...x, deleted: true, text: "" } : x)));
        else if (e.type === "react") setMessages((cur) => cur.map((x) => (x.id === e.id ? { ...x, reactions: e.reactions } : x)));
        else if (e.type === "typing" && e.channel === channelRef.current && e.userId !== me?.id) {
          setTyping((t) => ({ ...t, [e.userId]: { name: e.name, until: Date.now() + 4000 } }));
        }
      }),
    [me, loadChannels]
  );
  useEffect(() => {
    const t = setInterval(() => setTyping((cur) => Object.fromEntries(Object.entries(cur).filter(([, v]) => v && v.until > Date.now()))), 1000);
    return () => clearInterval(t);
  }, []);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    try {
      if (editing) {
        await chatApi(`/messages/${editing.id}`, "PATCH", { text: body });
        setEditing(null);
      } else {
        const r = await chatApi(`/channels/${encodeURIComponent(channel)}/messages`, "POST", { text: body, replyTo: replyTo?.id });
        setMessages((cur) => (cur.some((x) => x.id === r.message.id) ? cur : [...cur, r.message]));
        if (r.removed?.length) flash(`For safety we took out: ${r.removed.join(", ")}.`);
        setOrbs((o) => o);
        requestAnimationFrame(() => listRef.current && (listRef.current.scrollTop = listRef.current.scrollHeight));
      }
      setText("");
      setReplyTo(null);
    } catch (e) {
      flash(e.message);
    }
  };

  const loadOlder = async () => {
    if (!messages.length) return;
    const el = listRef.current;
    const h = el.scrollHeight;
    const r = await chatApi(`/channels/${encodeURIComponent(channel)}/messages?before=${messages[0].id}`).catch(() => null);
    if (!r) return;
    setMessages((cur) => [...r.messages, ...cur]);
    setMore(!!r.more);
    requestAnimationFrame(() => (el.scrollTop = el.scrollHeight - h));
  };

  const current = channel.startsWith("dm:") ? dms.find((d) => d.id === channel) : channels.find((c) => c.id === channel);
  const title = channel.startsWith("dm:") ? current?.user?.name || "Direct message" : `${current?.name || channel}`;
  const typingNames = Object.values(typing).filter(Boolean).map((t) => t.name);
  const byId = useMemo(() => Object.fromEntries(messages.map((m) => [m.id, m])), [messages]);

  if (loading)
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#313338]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  if (error || !me)
    return (
      <div className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#313338] text-slate-200 p-6 text-center">
        <p className="text-lg font-semibold">{error || "Nebulux Chat couldn't load."}</p>
        <button onClick={() => navigate("/chat")} className="px-4 py-2 rounded-lg bg-indigo-600 text-[#fff] text-sm">
          Back to Nebulux AI
        </button>
      </div>
    );

  const sidebarList = (
    <div className="flex h-full">
      {/* Server rail */}
      <div className="w-[72px] shrink-0 bg-[#1e1f22] flex flex-col items-center gap-2 py-3">
        <button
          onClick={() => navigate("/chat")}
          title="Back to Nebulux AI"
          aria-label="Back to Nebulux AI"
          className="w-12 h-12 rounded-full bg-[#313338] hover:rounded-2xl hover:bg-indigo-600 transition-all flex items-center justify-center text-slate-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-0.5 bg-[#35363c] rounded" />
        <button
          onClick={() => {
            setView("friends");
            setDrawer(false);
          }}
          title="Friends and messages"
          className={`w-12 h-12 flex items-center justify-center transition-all ${view === "friends" ? "rounded-2xl bg-indigo-600" : "rounded-full bg-[#313338] hover:rounded-2xl hover:bg-indigo-600"}`}
        >
          <MessageCircle className="w-5 h-5 text-[#fff]" />
        </button>
        <button onClick={() => openChannel("general")} title="Nebulux community" className={`w-12 h-12 overflow-hidden transition-all ${view === "server" && !channel.startsWith("dm:") ? "rounded-2xl" : "rounded-full hover:rounded-2xl"}`}>
          <img src="/logo.png" alt="Nebulux" className="w-full h-full object-cover" />
        </button>
        <div className="mt-auto flex flex-col items-center gap-1" title="Your stars">
          <span className="text-lg">⭐</span>
          <span className="text-[11px] font-bold text-violet-300">{stars}</span>
        </div>
      </div>
      {/* Channel list */}
      <div className="w-60 shrink-0 bg-[#2b2d31] flex flex-col">
        <div className="h-12 px-4 flex items-center border-b border-black/30 shadow-sm">
          <p className="font-bold text-white truncate">{view === "friends" ? "Direct Messages" : "Nebulux Community"}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {view === "server" && (
            <>
              <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Text channels</p>
              {channels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openChannel(c.id)}
                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left ${channel === c.id ? "bg-[#404249] text-white" : c.unread ? "text-white hover:bg-[#35373c]" : "text-slate-400 hover:bg-[#35373c] hover:text-slate-200"}`}
                >
                  <Hash className="w-5 h-5 text-slate-500 shrink-0" />
                  <span className={`truncate ${c.unread ? "font-semibold" : ""}`}>{c.name}</span>
                  {c.unread && channel !== c.id && <span className="ml-auto w-2 h-2 rounded-full bg-white" />}
                </button>
              ))}
            </>
          )}
          <p className="px-2 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Direct messages</p>
          <button onClick={() => { setView("friends"); setDrawer(false); }} className={`w-full flex items-center gap-2 px-2 py-2 rounded-md ${view === "friends" ? "bg-[#404249] text-white" : "text-slate-300 hover:bg-[#35373c]"}`}>
            <Users className="w-5 h-5" /> Friends
          </button>
          {dms.map((d) => (
            <button key={d.id} onClick={() => openChannel(d.id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md ${channel === d.id && view === "server" ? "bg-[#404249] text-white" : "text-slate-400 hover:bg-[#35373c] hover:text-slate-200"}`}>
              <Avatar user={d.user} size={32} />
              <span className={`truncate ${d.unread ? "font-semibold text-white" : ""}`}>{d.user.name}</span>
            </button>
          ))}
        </div>
        {/* Me */}
        <div className="h-[52px] px-2 bg-[#232428] flex items-center gap-2">
          <button onClick={() => setProfileOpen(true)} className="flex items-center gap-2 min-w-0 flex-1 rounded-md px-1 py-1 hover:bg-[#35373c] text-left">
            <Avatar user={me} size={32} online />
            <span className="min-w-0">
              <Name user={me} className="block truncate text-sm" />
              <span className="block text-[11px] text-slate-400">⭐ {stars} stars</span>
            </span>
          </button>
          <button onClick={() => setProfileOpen(true)} title="Profile, looks and Star shop" aria-label="Profile settings" className="p-2 rounded-md text-slate-300 hover:bg-[#35373c]">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-20 flex bg-[#313338] text-slate-200">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">{sidebarList}</div>
      {/* Phone drawer */}
      {drawer && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="flex shadow-2xl">{sidebarList}</div>
          <div className="flex-1 bg-black/50" onClick={() => setDrawer(false)} />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="h-12 shrink-0 px-3 flex items-center gap-2 border-b border-black/30 shadow-sm">
          <button onClick={() => setDrawer(true)} className="md:hidden p-2 -ml-1 rounded-md text-slate-300 hover:bg-[#35373c]" aria-label="Channels">
            <Menu className="w-5 h-5" />
          </button>
          {view === "friends" ? (
            <p className="font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" /> Friends
            </p>
          ) : (
            <p className="font-bold text-white flex items-center gap-1.5 min-w-0">
              {channel.startsWith("dm:") ? <Avatar user={current?.user} size={24} /> : <Hash className="w-5 h-5 text-slate-400" />}
              <span className="truncate">{title}</span>
              {current?.topic && <span className="hidden sm:inline ml-2 pl-3 border-l border-slate-600 text-sm font-normal text-slate-400 truncate">{current.topic}</span>}
            </p>
          )}
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => shell?.openProfile?.()}
              className="keep-color w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white font-bold"
              aria-label="Your Nebulux AI account"
            >
              {shell?.avatarInitial || "U"}
            </button>
          </div>
        </div>

        {notice && <div className="mx-3 mt-2 rounded-lg bg-amber-500/15 border border-amber-500/40 px-3 py-2 text-sm text-amber-200">{notice}</div>}

        {view === "friends" ? (
          <Friends me={me} onOpenDm={(id) => { loadChannels().then(() => openChannel(id)); }} onView={setViewUser} flash={flash} />
        ) : (
          <div className="flex-1 min-h-0 flex">
            <div className="flex-1 min-w-0 flex flex-col">
              <div ref={listRef} className="flex-1 overflow-y-auto py-4">
                {more && (
                  <div className="text-center pb-3">
                    <button onClick={loadOlder} className="text-xs text-indigo-300 hover:underline">
                      Load older messages
                    </button>
                  </div>
                )}
                {!more && (
                  <div className="px-4 pb-4">
                    <div className="w-16 h-16 rounded-full bg-[#41434a] flex items-center justify-center mb-2">{channel.startsWith("dm:") ? <Avatar user={current?.user} size={64} /> : <Hash className="w-9 h-9 text-white" />}</div>
                    <p className="text-2xl font-bold text-white">{channel.startsWith("dm:") ? current?.user?.name : `Welcome to #${title}!`}</p>
                    <p className="text-sm text-slate-400">{channel.startsWith("dm:") ? "This is the start of your messages." : current?.topic || "This is the start of this channel."}</p>
                  </div>
                )}
                {messages.map((m, i) => {
                  const prev = messages[i - 1];
                  const grouped = prev && prev.user.id === m.user.id && !m.replyTo && Date.parse(m.at) - Date.parse(prev.at) < 5 * 60 * 1000 && !prev.deleted;
                  const newDay = !prev || day(prev.at) !== day(m.at);
                  const reply = m.replyTo ? byId[m.replyTo] : null;
                  const mine = m.user.id === me.id;
                  return (
                    <React.Fragment key={m.id}>
                      {newDay && (
                        <div className="flex items-center gap-2 px-4 my-3">
                          <div className="flex-1 h-px bg-slate-600/50" />
                          <span className="text-[11px] font-semibold text-slate-400">{day(m.at)}</span>
                          <div className="flex-1 h-px bg-slate-600/50" />
                        </div>
                      )}
                      <div className={`group relative flex gap-4 px-4 hover:bg-[#2e3035] ${grouped ? "py-0.5" : "pt-2 pb-0.5 mt-2"}`}>
                        <div className="w-10 shrink-0">
                          {!grouped ? (
                            <button onClick={() => setViewUser(m.user)} aria-label={`${m.user.name}'s profile`}>
                              <Avatar user={m.user} size={40} />
                            </button>
                          ) : (
                            <span className="hidden group-hover:block text-[10px] text-slate-500 pt-1 text-right">{time(m.at)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {reply && (
                            <p className="text-xs text-slate-400 truncate mb-0.5">
                              ↪ <Name user={reply.user} className="text-xs" /> {reply.deleted ? "message deleted" : reply.text}
                            </p>
                          )}
                          {!grouped && (
                            <p className="leading-5">
                              <button onClick={() => setViewUser(m.user)} className="hover:underline">
                                <Name user={m.user} />
                              </button>
                              <span className="ml-2 text-[11px] text-slate-500">{day(m.at) === day(new Date().toISOString()) ? `Today at ${time(m.at)}` : `${day(m.at)} ${time(m.at)}`}</span>
                            </p>
                          )}
                          {m.deleted ? (
                            <p className="text-sm italic text-slate-500">This message was deleted.</p>
                          ) : (
                            <p className="text-[15px] leading-[1.375rem] text-slate-100 whitespace-pre-wrap break-words">
                              {m.text}
                              {m.edited && <span className="ml-1 text-[10px] text-slate-500">(edited)</span>}
                            </p>
                          )}
                          {Object.keys(m.reactions || {}).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(m.reactions).map(([emo, users]) => (
                                <button
                                  key={emo}
                                  onClick={() => chatApi(`/messages/${m.id}/react`, "POST", { emoji: emo }).then((r) => setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...x, reactions: r.reactions } : x)))).catch((e) => flash(e.message))}
                                  className={`px-1.5 py-0.5 rounded-md text-xs border ${users.includes(me.id) ? "bg-indigo-500/20 border-indigo-400" : "bg-[#2b2d31] border-transparent hover:border-slate-500"}`}
                                >
                                  {emo} {users.length}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {!m.deleted && (
                          <div className="absolute -top-3 right-4 hidden group-hover:flex items-center rounded-md bg-[#313338] border border-black/40 shadow-lg">
                            {REACTIONS.slice(0, 4).map((emo) => (
                              <button key={emo} title={`React ${emo}`} onClick={() => chatApi(`/messages/${m.id}/react`, "POST", { emoji: emo }).then((r) => setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...x, reactions: r.reactions } : x)))).catch((e) => flash(e.message))} className="px-1.5 py-1 hover:bg-[#404249] text-sm">
                                {emo}
                              </button>
                            ))}
                            <button title="Reply" aria-label="Reply" onClick={() => setReplyTo(m)} className="p-1.5 hover:bg-[#404249] text-slate-300">
                              <Reply className="w-4 h-4" />
                            </button>
                            {mine && (
                              <button title="Edit" aria-label="Edit" onClick={() => { setEditing(m); setText(m.text); }} className="p-1.5 hover:bg-[#404249] text-slate-300">
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {(mine || me.admin) && (
                              <button title="Delete" aria-label="Delete" onClick={async () => { if (await askConfirm("Delete this message?")) chatApi(`/messages/${m.id}`, "DELETE").catch((e) => flash(e.message)); }} className="p-1.5 hover:bg-[#404249] text-red-400">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {!mine && (
                              <button title="Report" aria-label="Report" onClick={async () => { if (await askConfirm("Report this message to the Nebulux team?")) chatApi(`/messages/${m.id}/report`, "POST", {}).then(() => flash("Thanks, we'll take a look.")).catch((e) => flash(e.message)); }} className="p-1.5 hover:bg-[#404249] text-slate-300">
                                <Flag className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
              {/* Composer */}
              <div className="px-4 pb-4">
                {(replyTo || editing) && (
                  <div className="flex items-center justify-between rounded-t-lg bg-[#2b2d31] px-3 py-1.5 text-xs text-slate-300">
                    <span className="truncate">{editing ? "Editing your message" : <>Replying to <Name user={replyTo.user} className="text-xs" /></>}</span>
                    <button onClick={() => { setReplyTo(null); setEditing(null); setText(""); }} aria-label="Cancel" className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className={`flex items-end gap-2 bg-[#383a40] px-3 ${replyTo || editing ? "rounded-b-lg" : "rounded-lg"}`}>
                  <textarea
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      if (Date.now() - typingSent.current > 3000) {
                        typingSent.current = Date.now();
                        sendTyping(channel, me.name);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                      if (e.key === "Escape") {
                        setReplyTo(null);
                        setEditing(null);
                      }
                    }}
                    rows={1}
                    maxLength={2000}
                    placeholder={channel.startsWith("dm:") ? `Message @${title}` : `Message #${title}`}
                    className="flex-1 bg-transparent resize-none outline-none py-3 text-[15px] text-slate-100 placeholder:text-slate-500 max-h-40"
                  />
                  <button onClick={send} disabled={!text.trim()} aria-label="Send" className="p-2.5 text-slate-300 hover:text-white disabled:opacity-40">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="h-5 pt-1 text-xs text-slate-400">{typingNames.length ? `${typingNames.slice(0, 3).join(", ")} ${typingNames.length > 1 ? "are" : "is"} typing…` : ""}</p>
              </div>
            </div>
            {/* Members */}
            {!channel.startsWith("dm:") && (
              <div className="hidden lg:block w-60 shrink-0 bg-[#2b2d31] overflow-y-auto px-2 py-4">
                {[["Online", people.filter((p) => p.online)], ["Offline", people.filter((p) => !p.online)]].map(([label, list]) =>
                  list.length ? (
                    <div key={label} className="mb-4">
                      <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        {label} — {list.length}
                      </p>
                      {list.map((p) => (
                        <button key={p.id} onClick={() => setViewUser(p)} className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#35373c] ${p.online ? "" : "opacity-50"}`}>
                          <Avatar user={p} size={32} online={p.online} />
                          <Name user={p} className="truncate text-sm" />
                        </button>
                      ))}
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {profileOpen && meta && (
        <ProfileEditor
          me={me}
          orbs={orbs}
          meta={meta}
          onClose={() => setProfileOpen(false)}
          onSaved={(p) => setMe(p)}
          onOrbs={(o, owned) => {
            setOrbs(o);
            if (owned) setMeta((m) => ({ ...m, owned }));
          }}
          onDaily={() =>
            chatApi("/daily", "POST")
              .then((r) => {
                setOrbs(r.orbs);
                setMeta((m) => ({ ...m, dailyReady: false }));
                addNotification({ kind: "reward", text: `You got ${r.got} stars! Come back tomorrow for more.` });
              })
              .catch((e) => flash(e.message))
          }
        />
      )}
      {viewUser && <UserCard user={viewUser} me={me} onClose={() => setViewUser(null)} flash={flash} onMessage={(id) => { setViewUser(null); loadChannels().then(() => openChannel(id)); }} />}
    </div>
  );
}

function Modal({ children, onClose, wide }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className={`relative w-full ${wide ? "max-w-2xl" : "max-w-sm"} max-h-[90vh] overflow-y-auto rounded-2xl bg-[#313338] border border-black/40 shadow-2xl`}>
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-slate-400 hover:bg-[#404249] hover:text-white">
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

function UserCard({ user, me, onClose, flash, onMessage }) {
  const [busy, setBusy] = useState(false);
  const self = user.id === me.id;
  return (
    <Modal onClose={onClose}>
      <div className="h-20 rounded-t-2xl" style={{ background: user.avatarBg }} />
      <div className="px-5 pb-5 -mt-10">
        <Avatar user={user} size={80} />
        <p className="mt-2 text-xl">
          <Name user={user} />
        </p>
        {user.bio && <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{user.bio}</p>}
        {!self && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => {
                setBusy(true);
                chatApi("/friends", "POST", { userId: user.id })
                  .then((r) => flash(r.status === "friend" ? `You and ${user.name} are friends now!` : "Friend request sent."))
                  .catch((e) => flash(e.message))
                  .finally(() => setBusy(false));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 text-[#fff] text-sm font-medium hover:bg-emerald-500"
            >
              <UserPlus className="w-4 h-4" /> Add friend
            </button>
            <button onClick={() => onMessage(`dm:${[me.id, user.id].sort().join(":")}`)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-indigo-600 text-[#fff] text-sm font-medium hover:bg-indigo-500">
              <MessageCircle className="w-4 h-4" /> Message
            </button>
            <button
              onClick={async () => {
                if (!(await askConfirm(`Block ${user.name}? They won't be able to message you or add you.`))) return;
                chatApi("/blocks", "POST", { userId: user.id }).then(() => { flash(`${user.name} is blocked.`); onClose(); }).catch((e) => flash(e.message));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#4e5058] text-[#fff] text-sm font-medium hover:bg-[#6d6f78]"
            >
              <Ban className="w-4 h-4" /> Block
            </button>
            {me.admin && (
              <button
                onClick={async () => {
                  if (!(await askConfirm(`Ban ${user.name} from Nebulux Chat?`))) return;
                  chatApi("/admin/ban", "POST", { userId: user.id }).then(() => { flash(`${user.name} is banned from chat.`); onClose(); }).catch((e) => flash(e.message));
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-red-600 text-[#fff] text-sm font-medium hover:bg-red-500"
              >
                Ban from chat
              </button>
            )}
          </div>
        )}
        <p className="mt-3 text-[11px] text-slate-500">You can only send direct messages to friends. Never share your address, school, phone number or passwords.</p>
      </div>
    </Modal>
  );
}

function Friends({ me, onOpenDm, onView, flash }) {
  const [tab, setTab] = useState("online");
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [found, setFound] = useState([]);
  const load = useCallback(() => chatApi("/friends").then((r) => setList(r.friends || [])).catch((e) => flash(e.message)), [flash]);
  useEffect(() => {
    load();
    return onChatEvent((e) => e.type === "notification" && e.kind === "friend" && load());
  }, [load]);
  const shown = tab === "online" ? list.filter((f) => f.status === "friend" && f.online) : tab === "all" ? list.filter((f) => f.status === "friend") : tab === "pending" ? list.filter((f) => f.status !== "friend") : [];
  const pending = list.filter((f) => f.status === "incoming").length;
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-black/30">
        {[["online", "Online"], ["all", "All"], ["pending", `Pending${pending ? ` (${pending})` : ""}`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-2.5 py-1 rounded-md text-sm ${tab === id ? "bg-[#404249] text-white" : "text-slate-400 hover:bg-[#35373c] hover:text-slate-200"}`}>
            {label}
          </button>
        ))}
        <button onClick={() => setTab("add")} className={`px-2.5 py-1 rounded-md text-sm font-medium ${tab === "add" ? "text-emerald-400" : "bg-emerald-600 text-[#fff]"}`}>
          Add Friend
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {tab === "add" ? (
          <div className="max-w-xl">
            <p className="font-bold text-white">ADD FRIEND</p>
            <p className="text-sm text-slate-400">Find people by their Nebulux Chat name.</p>
            <div className="mt-3 flex gap-2">
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim().length >= 2) chatApi(`/people?q=${encodeURIComponent(e.target.value.trim())}`).then((r) => setFound((r.people || []).filter((p) => p.id !== me.id))).catch(() => {});
                  else setFound([]);
                }}
                placeholder="Their name"
                className="flex-1 rounded-lg bg-[#1e1f22] px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="mt-3 space-y-1">
              {found.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[#35373c]">
                  <Avatar user={p} size={32} online={p.online} />
                  <Name user={p} className="flex-1 truncate" />
                  <button onClick={() => chatApi("/friends", "POST", { userId: p.id }).then((r) => { flash(r.status === "friend" ? "You're friends now!" : "Friend request sent."); load(); }).catch((e) => flash(e.message))} className="px-3 py-1.5 rounded-md bg-emerald-600 text-[#fff] text-xs font-medium">
                    Send request
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : shown.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-16">{tab === "pending" ? "No pending friend requests." : "No friends here yet. Tap Add Friend to find people."}</p>
        ) : (
          <div className="space-y-1">
            {shown.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[#35373c] border-t border-slate-700/40">
                <button onClick={() => onView(f)}>
                  <Avatar user={f} size={36} online={f.online} />
                </button>
                <span className="flex-1 min-w-0">
                  <Name user={f} className="block truncate" />
                  <span className="text-xs text-slate-400">{f.status === "incoming" ? "Wants to be friends" : f.status === "sent" ? "Request sent" : f.online ? "Online" : "Offline"}</span>
                </span>
                {f.status === "friend" && (
                  <button onClick={() => onOpenDm(f.dm)} title="Message" aria-label={`Message ${f.name}`} className="p-2 rounded-full bg-[#2b2d31] text-slate-300 hover:text-white">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}
                {f.status === "incoming" && (
                  <button onClick={() => chatApi("/friends", "POST", { userId: f.id }).then(load).catch((e) => flash(e.message))} title="Accept" aria-label="Accept" className="p-2 rounded-full bg-[#2b2d31] text-emerald-400">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={async () => { if (await askConfirm(f.status === "friend" ? `Remove ${f.name} as a friend?` : "Cancel this request?")) chatApi(`/friends/${f.id}`, "DELETE").then(load); }} title="Remove" aria-label="Remove" className="p-2 rounded-full bg-[#2b2d31] text-slate-400 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileEditor({ me, orbs, meta, onClose, onSaved, onOrbs, onDaily }) {
  const [tab, setTab] = useState("profile");
  const [draft, setDraft] = useState({ name: me.name, avatar: me.avatar, avatarBg: me.avatarBg, nameColor: me.nameColor, frame: me.frame || "", badge: me.badge || "", bio: me.bio || "" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const owned = meta.owned || [];
  const shop = meta.shop || {};
  const ownedColors = Object.entries(shop).filter(([id, it]) => it.kind === "name_color" && owned.includes(id)).map(([, it]) => it.value);
  const colors = [...(meta.freeColors || []), ...ownedColors];
  const preview = { ...me, ...draft };

  const save = () => {
    setSaving(true);
    setErr("");
    chatApi("/me", "PATCH", draft)
      .then((r) => {
        onSaved(r.me);
        onClose();
      })
      .catch((e) => setErr(e.message))
      .finally(() => setSaving(false));
  };

  return (
    <Modal onClose={onClose} wide>
      <div className="flex border-b border-black/30 px-5 pt-4 gap-4">
        {[["profile", "My profile"], ["shop", "Star shop"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`pb-3 text-sm font-semibold border-b-2 ${tab === id ? "border-indigo-400 text-white" : "border-transparent text-slate-400"}`}>
            {label}
          </button>
        ))}
        <span className="ml-auto pb-3 text-sm font-bold text-violet-300 pr-8">⭐ {stars}</span>
      </div>
      {tab === "profile" ? (
        <div className="p-5 grid sm:grid-cols-2 gap-5">
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-400">Display name</span>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={24} className="mt-1 w-full rounded-lg bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>
            <div>
              <span className="text-xs font-bold uppercase text-slate-400">Avatar</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(meta.avatars || []).map((a) => (
                  <button key={a} onClick={() => setDraft({ ...draft, avatar: a })} className={`w-9 h-9 rounded-lg text-lg ${draft.avatar === a ? "bg-indigo-600" : "bg-[#1e1f22] hover:bg-[#404249]"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-slate-400">Avatar color</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(meta.avatarBgs || []).map((c) => (
                  <button key={c} aria-label={c} onClick={() => setDraft({ ...draft, avatarBg: c })} className={`keep-color w-7 h-7 rounded-full ${draft.avatarBg === c ? "ring-2 ring-white" : ""}`} style={{ background: c }} />
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-slate-400">Name tag color</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {colors.map((c) => (
                  <button key={c} aria-label={c} onClick={() => setDraft({ ...draft, nameColor: c })} className={`keep-color w-7 h-7 rounded-full ${draft.nameColor === c ? "ring-2 ring-white" : ""}`} style={{ background: c }} />
                ))}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Get more colors in the Star shop.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[["frame", "Avatar frame"], ["badge", "Badge"]].map(([field, label]) => (
                <label key={field} className="block">
                  <span className="text-xs font-bold uppercase text-slate-400">{label}</span>
                  <select value={draft[field]} onChange={(e) => setDraft({ ...draft, [field]: e.target.value })} className="mt-1 w-full rounded-lg bg-[#1e1f22] px-2 py-2 text-sm text-white outline-none">
                    <option value="">None</option>
                    {Object.entries(shop)
                      .filter(([id, it]) => it.kind === field && owned.includes(id))
                      .map(([id, it]) => (
                        <option key={id} value={it.value}>
                          {it.name}
                        </option>
                      ))}
                  </select>
                </label>
              ))}
            </div>
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-400">About me</span>
              <textarea value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value.slice(0, 190) })} rows={3} placeholder="Say something about yourself (no personal info!)" className="mt-1 w-full resize-none rounded-lg bg-[#1e1f22] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Preview</span>
            <div className="mt-1 rounded-xl bg-[#232428] overflow-hidden">
              <div className="h-16" style={{ background: draft.avatarBg }} />
              <div className="px-4 pb-4 -mt-8">
                <Avatar user={preview} size={64} online />
                <p className="mt-2 text-lg">
                  <Name user={preview} />
                </p>
                {draft.bio && <p className="mt-1 text-sm text-slate-300 whitespace-pre-wrap break-words">{draft.bio}</p>}
              </div>
            </div>
            <button onClick={onDaily} disabled={!meta.dailyReady} className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-violet-600 text-[#fff] text-sm font-semibold hover:bg-violet-500 disabled:opacity-40">
              <Gift className="w-4 h-4" /> {meta.dailyReady ? "Claim today's stars" : "Come back tomorrow for more stars"}
            </button>
            <p className="mt-2 text-[11px] text-slate-500">Earn stars every day and by chatting (up to 25 a day).</p>
            {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
            <button onClick={save} disabled={saving} className="mt-4 w-full px-3 py-2.5 rounded-lg bg-emerald-600 text-[#fff] text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <p className="text-sm text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-300" /> Spend stars on name tag colors, avatar frames and badges.
          </p>
          {err && <p className="mb-3 text-sm text-red-400">{err}</p>}
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.entries(shop).map(([id, it]) => {
              const have = owned.includes(id);
              return (
                <div key={id} className="flex items-center gap-3 rounded-xl bg-[#2b2d31] p-3">
                  <span className="keep-color w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-lg" style={{ background: it.kind === "name_color" ? it.value : "#1e1f22" }}>
                    {it.kind === "badge" ? it.value : it.kind === "frame" ? <span className={`w-7 h-7 rounded-full bg-slate-600 ${FRAME[it.value]}`} /> : ""}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-white">{it.name}</span>
                    <span className="block text-xs text-violet-300">⭐ {it.price}</span>
                  </span>
                  <button
                    disabled={have || orbs < it.price}
                    onClick={() => { setErr(""); chatApi("/shop/buy", "POST", { item: id }).then((r) => onOrbs(r.stars, r.owned)).catch((e) => setErr(e.message)); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 text-[#fff] text-xs font-semibold disabled:opacity-40"
                  >
                    {have ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />} {have ? "Owned" : "Buy"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
