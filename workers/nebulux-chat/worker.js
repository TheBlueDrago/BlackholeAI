// nebulux-chat: the server behind Nebulux Chat (the Discord-style chat in the app). Free Cloudflare
// parts only: D1 (the DB binding) keeps profiles, channels, messages, friends and notifications,
// and one Durable Object (Hub) holds everyone's live connection, so new messages, typing and
// notifications arrive instantly. People are recognised by their Nebulux AI (Base44) sign-in.
import { cleanMessage, cleanName } from "./safety.js";
import { SHOP, DAILY_ORBS, ORBS_PER_MESSAGE, MAX_MESSAGE_ORBS_PER_DAY, FREE_COLORS, AVATAR_EMOJI, AVATAR_BG } from "./shop.js";

const APP_ID = "6a8b5eb7787b8a4d6a18f662";
const BASE44 = "https://blackhole-ai.base44.app";
const ORIGINS = ["https://nebuluxai.com", "https://www.nebuluxai.com", "https://blackhole-ai-tech.com", "https://www.blackhole-ai-tech.com"];
const PAGE = 50;

const now = () => new Date().toISOString();
const today = () => now().slice(0, 10);

function cors(request) {
  const o = request.headers.get("origin") || "";
  return {
    "access-control-allow-origin": ORIGINS.includes(o) ? o : ORIGINS[0],
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    vary: "origin",
  };
}
const json = (request, data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...cors(request) } });
const fail = (request, error, status = 400) => json(request, { error }, status);

// Who is asking: their Base44 account, checked once per token and remembered for 10 minutes.
async function whoIs(token) {
  if (!token || token.length > 4096) return null;
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const key = new Request(`https://nebulux-chat.internal/who/${hash}`);
  const hit = await caches.default.match(key).catch(() => null);
  if (hit) return hit.json();
  const res = await fetch(`${BASE44}/api/apps/${APP_ID}/entities/User/me`, { headers: { authorization: `Bearer ${token}`, "X-App-Id": APP_ID } }).catch(() => null);
  if (!res || !res.ok) return null;
  const u = await res.json().catch(() => null);
  if (!u || !u.id) return null;
  const who = { id: String(u.id), name: String(u.full_name || u.email || "Explorer").split("@")[0].slice(0, 24), admin: u.role === "admin" };
  await caches.default.put(key, new Response(JSON.stringify(who), { headers: { "cache-control": "max-age=600" } })).catch(() => {});
  return who;
}

const rowToProfile = (p) =>
  p && {
    id: p.user_id,
    name: p.name,
    avatar: p.avatar,
    avatarBg: p.avatar_bg,
    nameColor: p.name_color,
    frame: p.frame,
    badge: p.badge,
    bio: p.bio,
    admin: !!p.is_admin,
  };

// The profile for this person, made the first time they open the chat.
async function profileOf(env, who) {
  let p = await env.DB.prepare("SELECT * FROM profiles WHERE user_id = ?").bind(who.id).first();
  if (!p) {
    let name = (cleanName(who.name).name || "Explorer").slice(0, 20);
    for (let i = 0; i < 5; i++) {
      const taken = await env.DB.prepare("SELECT 1 FROM profiles WHERE lower(name) = lower(?)").bind(name).first();
      if (!taken) break;
      name = `${name.slice(0, 18)}${Math.floor(Math.random() * 900 + 100)}`;
    }
    const avatar = AVATAR_EMOJI[Math.floor(Math.random() * AVATAR_EMOJI.length)];
    const bg = AVATAR_BG[Math.floor(Math.random() * AVATAR_BG.length)];
    await env.DB.prepare("INSERT OR IGNORE INTO profiles (user_id, name, avatar, avatar_bg, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(who.id, name, avatar, bg, who.admin ? 1 : 0, now()).run();
    p = await env.DB.prepare("SELECT * FROM profiles WHERE user_id = ?").bind(who.id).first();
  } else if (!!p.is_admin !== who.admin) {
    await env.DB.prepare("UPDATE profiles SET is_admin = ? WHERE user_id = ?").bind(who.admin ? 1 : 0, who.id).run();
    p.is_admin = who.admin ? 1 : 0;
  }
  return p;
}

const dmId = (a, b) => `dm:${[a, b].sort().join(":")}`;
const dmUsers = (id) => (id.startsWith("dm:") ? id.slice(3).split(":") : null);

async function areFriends(env, a, b) {
  return !!(await env.DB.prepare("SELECT 1 FROM friends WHERE status = 'accepted' AND ((a = ? AND b = ?) OR (a = ? AND b = ?))").bind(a, b, b, a).first());
}
async function blocked(env, a, b) {
  return !!(await env.DB.prepare("SELECT 1 FROM blocks WHERE (user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)").bind(a, b, b, a).first());
}
// Can this person read and write in this channel?
async function canUse(env, userId, channelId) {
  const pair = dmUsers(channelId);
  if (pair) return pair.includes(userId) && (await areFriends(env, pair[0], pair[1]));
  return !!(await env.DB.prepare("SELECT 1 FROM channels WHERE id = ? AND server_id = 'nebulux'").bind(channelId).first());
}

// Live updates through the Hub. `to`: a list of user ids, or null for everyone connected.
async function push(env, event, to = null) {
  const hub = env.HUB.get(env.HUB.idFromName("hub"));
  await hub.fetch("https://hub/push", { method: "POST", body: JSON.stringify({ event, to }) }).catch(() => {});
}

async function notify(env, userId, kind, text, link) {
  await env.DB.prepare("INSERT INTO notifications (user_id, kind, text, link, created_at) VALUES (?, ?, ?, ?, ?)").bind(userId, kind, text.slice(0, 200), link || "", now()).run();
  await push(env, { type: "notification", kind, text: text.slice(0, 200), link: link || "" }, [userId]);
}

async function withAuthors(env, rows) {
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const people = {};
  if (ids.length) {
    const res = await env.DB.prepare(`SELECT * FROM profiles WHERE user_id IN (${ids.map(() => "?").join(",")})`).bind(...ids).all();
    for (const p of res.results || []) people[p.user_id] = rowToProfile(p);
  }
  return rows.map((r) => ({
    id: r.id,
    channel: r.channel_id,
    user: people[r.user_id] || { id: r.user_id, name: "Unknown", avatar: "❔", avatarBg: "#334155", nameColor: "#94a3b8" },
    text: r.deleted ? "" : r.text,
    deleted: !!r.deleted,
    replyTo: r.reply_to,
    reactions: JSON.parse(r.reactions || "{}"),
    edited: !!r.edited_at,
    at: r.created_at,
  }));
}

async function route(request, env, who) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, "");
  const method = request.method;
  const body = method === "GET" ? {} : await request.json().catch(() => ({}));
  const me = await profileOf(env, who);
  if (me.banned) return fail(request, "You can't use Nebulux Chat right now.", 403);
  const seg = path.split("/").filter(Boolean);

  // --- my profile, orbs and the shop
  if (path === "/me" && method === "GET") {
    await env.DB.prepare("UPDATE profiles SET last_seen = ? WHERE user_id = ?").bind(now(), who.id).run();
    return json(request, { me: rowToProfile(me), orbs: me.orbs, owned: JSON.parse(me.owned || "[]"), dailyReady: me.daily_at !== today(), shop: SHOP, freeColors: FREE_COLORS, avatars: AVATAR_EMOJI, avatarBgs: AVATAR_BG });
  }
  if (path === "/me" && method === "PATCH") {
    const owned = JSON.parse(me.owned || "[]");
    const sets = [];
    const vals = [];
    if (body.name !== undefined) {
      const n = cleanName(body.name);
      if (n.error) return fail(request, n.error);
      const taken = await env.DB.prepare("SELECT 1 FROM profiles WHERE lower(name) = lower(?) AND user_id != ?").bind(n.name, who.id).first();
      if (taken) return fail(request, "Someone already has that name.");
      sets.push("name = ?");
      vals.push(n.name);
    }
    if (body.avatar !== undefined) {
      if (!AVATAR_EMOJI.includes(body.avatar)) return fail(request, "Pick one of the avatars.");
      sets.push("avatar = ?");
      vals.push(body.avatar);
    }
    if (body.avatarBg !== undefined) {
      if (!AVATAR_BG.includes(body.avatarBg)) return fail(request, "Pick one of the colors.");
      sets.push("avatar_bg = ?");
      vals.push(body.avatarBg);
    }
    if (body.nameColor !== undefined) {
      const bought = Object.entries(SHOP).find(([id, it]) => it.kind === "name_color" && it.value === body.nameColor && owned.includes(id));
      if (!FREE_COLORS.includes(body.nameColor) && !bought) return fail(request, "Get that color in the Orb shop first.");
      sets.push("name_color = ?");
      vals.push(body.nameColor);
    }
    for (const [field, kind] of [["frame", "frame"], ["badge", "badge"]]) {
      if (body[field] === undefined) continue;
      const ok = body[field] === "" || Object.entries(SHOP).some(([id, it]) => it.kind === kind && it.value === body[field] && owned.includes(id));
      if (!ok) return fail(request, `Get that ${kind} in the Orb shop first.`);
      sets.push(`${field} = ?`);
      vals.push(body[field]);
    }
    if (body.bio !== undefined) {
      const c = cleanMessage(body.bio || " ");
      if (c.error && body.bio) return fail(request, c.error);
      sets.push("bio = ?");
      vals.push(body.bio ? c.text.slice(0, 190) : "");
    }
    if (sets.length) await env.DB.prepare(`UPDATE profiles SET ${sets.join(", ")} WHERE user_id = ?`).bind(...vals, who.id).run();
    const p = await env.DB.prepare("SELECT * FROM profiles WHERE user_id = ?").bind(who.id).first();
    return json(request, { me: rowToProfile(p) });
  }
  if (path === "/daily" && method === "POST") {
    if (me.daily_at === today()) return fail(request, "You already got today's orbs. Come back tomorrow!");
    await env.DB.prepare("UPDATE profiles SET orbs = orbs + ?, daily_at = ? WHERE user_id = ?").bind(DAILY_ORBS, today(), who.id).run();
    return json(request, { orbs: me.orbs + DAILY_ORBS, got: DAILY_ORBS });
  }
  if (path === "/shop/buy" && method === "POST") {
    const item = SHOP[body.item];
    if (!item) return fail(request, "That item isn't in the shop.");
    const owned = JSON.parse(me.owned || "[]");
    if (owned.includes(body.item)) return fail(request, "You already have that.");
    if (me.orbs < item.price) return fail(request, `You need ${item.price - me.orbs} more orbs.`);
    owned.push(body.item);
    const r = await env.DB.prepare("UPDATE profiles SET orbs = orbs - ?, owned = ? WHERE user_id = ? AND orbs >= ?").bind(item.price, JSON.stringify(owned), who.id, item.price).run();
    if (!r.meta.changes) return fail(request, "Not enough orbs.");
    return json(request, { orbs: me.orbs - item.price, owned });
  }

  // --- channels and messages
  if (path === "/channels" && method === "GET") {
    const ch = await env.DB.prepare("SELECT id, name, topic FROM channels WHERE server_id = 'nebulux' ORDER BY position").all();
    const reads = await env.DB.prepare("SELECT channel_id, last_id FROM reads WHERE user_id = ?").bind(who.id).all();
    const last = await env.DB.prepare("SELECT channel_id, MAX(id) AS last FROM messages WHERE deleted = 0 GROUP BY channel_id").all();
    const readMap = Object.fromEntries((reads.results || []).map((r) => [r.channel_id, r.last_id]));
    const lastMap = Object.fromEntries((last.results || []).map((r) => [r.channel_id, r.last]));
    const unread = (id) => (lastMap[id] || 0) > (readMap[id] || 0);
    const channels = (ch.results || []).map((c) => ({ ...c, unread: unread(c.id) }));
    // DMs: one per friend you've talked with.
    const dms = await env.DB.prepare("SELECT DISTINCT channel_id FROM messages WHERE channel_id LIKE ? OR channel_id LIKE ?").bind(`dm:${who.id}:%`, `dm:%:${who.id}`).all();
    const others = (dms.results || []).map((r) => dmUsers(r.channel_id).find((u) => u !== who.id));
    let dmList = [];
    if (others.length) {
      const ps = await env.DB.prepare(`SELECT * FROM profiles WHERE user_id IN (${others.map(() => "?").join(",")})`).bind(...others).all();
      dmList = (ps.results || []).map((p) => ({ id: dmId(who.id, p.user_id), user: rowToProfile(p), unread: unread(dmId(who.id, p.user_id)) }));
    }
    return json(request, { channels, dms: dmList });
  }
  if (seg[0] === "channels" && seg[1] && seg[2] === "messages") {
    const channelId = decodeURIComponent(seg[1]);
    if (!(await canUse(env, who.id, channelId))) return fail(request, "You can't open that chat.", 403);
    if (method === "GET") {
      const before = Number(url.searchParams.get("before")) || 2 ** 52;
      const rows = await env.DB.prepare("SELECT * FROM messages WHERE channel_id = ? AND id < ? ORDER BY id DESC LIMIT ?").bind(channelId, before, PAGE).all();
      const list = (rows.results || []).reverse();
      if (list.length) await env.DB.prepare("INSERT INTO reads (user_id, channel_id, last_id) VALUES (?, ?, ?) ON CONFLICT(user_id, channel_id) DO UPDATE SET last_id = MAX(last_id, excluded.last_id)").bind(who.id, channelId, list[list.length - 1].id).run();
      return json(request, { messages: await withAuthors(env, list), more: list.length === PAGE });
    }
    if (method === "POST") {
      const c = cleanMessage(body.text);
      if (c.error) return fail(request, c.error);
      // Slow down floods: at most 8 messages in 10 seconds.
      const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM messages WHERE user_id = ? AND created_at > ?").bind(who.id, new Date(Date.now() - 10000).toISOString()).first();
      if (recent && recent.n >= 8) return fail(request, "Slow down a little!", 429);
      const replyTo = Number(body.replyTo) || null;
      const ins = await env.DB.prepare("INSERT INTO messages (channel_id, user_id, text, reply_to, created_at) VALUES (?, ?, ?, ?, ?)").bind(channelId, who.id, c.text, replyTo, now()).run();
      const row = await env.DB.prepare("SELECT * FROM messages WHERE id = ?").bind(ins.meta.last_row_id).first();
      const [msg] = await withAuthors(env, [row]);
      const pair = dmUsers(channelId);
      await push(env, { type: "message", message: msg }, pair);
      // Orbs for chatting, up to a daily cap.
      const day = today();
      const earned = me.earned_day === day ? me.earned_today : 0;
      if (earned < MAX_MESSAGE_ORBS_PER_DAY) await env.DB.prepare("UPDATE profiles SET orbs = orbs + ?, earned_day = ?, earned_today = ? WHERE user_id = ?").bind(ORBS_PER_MESSAGE, day, earned + 1, who.id).run();
      if (pair) {
        const other = pair.find((u) => u !== who.id);
        await notify(env, other, "message", `${me.name}: ${c.text.slice(0, 80)}`, `/chat/community?c=${encodeURIComponent(channelId)}`);
      } else {
        // @mentions
        const names = [...new Set((c.text.match(/@([\p{L}\p{N}_.-]{2,24})/gu) || []).map((m) => m.slice(1).toLowerCase()))].slice(0, 5);
        for (const n of names) {
          const p = await env.DB.prepare("SELECT user_id FROM profiles WHERE lower(name) = ?").bind(n).first();
          if (p && p.user_id !== who.id) await notify(env, p.user_id, "message", `${me.name} mentioned you in #${channelId}`, `/chat/community?c=${channelId}`);
        }
      }
      return json(request, { message: msg, removed: c.removed });
    }
  }
  if (seg[0] === "messages" && seg[1]) {
    const id = Number(seg[1]);
    const row = await env.DB.prepare("SELECT * FROM messages WHERE id = ?").bind(id).first();
    if (!row || row.deleted) return fail(request, "That message is gone.", 404);
    if (!(await canUse(env, who.id, row.channel_id))) return fail(request, "You can't do that.", 403);
    const pair = dmUsers(row.channel_id);
    if (seg[2] === "react" && method === "POST") {
      const emoji = String(body.emoji || "");
      if (!["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👀"].includes(emoji)) return fail(request, "Pick one of the reactions.");
      const r = JSON.parse(row.reactions || "{}");
      const list = r[emoji] || [];
      r[emoji] = list.includes(who.id) ? list.filter((u) => u !== who.id) : [...list, who.id];
      if (!r[emoji].length) delete r[emoji];
      await env.DB.prepare("UPDATE messages SET reactions = ? WHERE id = ?").bind(JSON.stringify(r), id).run();
      await push(env, { type: "react", id, channel: row.channel_id, reactions: r }, pair);
      return json(request, { reactions: r });
    }
    if (seg[2] === "report" && method === "POST") {
      await env.DB.prepare("INSERT INTO reports (reporter_id, message_id, user_id, reason, created_at) VALUES (?, ?, ?, ?, ?)").bind(who.id, id, row.user_id, String(body.reason || "").slice(0, 300), now()).run();
      return json(request, { ok: true });
    }
    const mine = row.user_id === who.id;
    if (method === "PATCH") {
      if (!mine) return fail(request, "You can only edit your own messages.", 403);
      const c = cleanMessage(body.text);
      if (c.error) return fail(request, c.error);
      await env.DB.prepare("UPDATE messages SET text = ?, edited_at = ? WHERE id = ?").bind(c.text, now(), id).run();
      await push(env, { type: "edit", id, channel: row.channel_id, text: c.text }, pair);
      return json(request, { ok: true, text: c.text });
    }
    if (method === "DELETE") {
      if (!mine && !me.is_admin) return fail(request, "You can only delete your own messages.", 403);
      await env.DB.prepare("UPDATE messages SET deleted = 1 WHERE id = ?").bind(id).run();
      await push(env, { type: "delete", id, channel: row.channel_id }, pair);
      return json(request, { ok: true });
    }
  }

  // --- people, friends, blocks
  if (path === "/people" && method === "GET") {
    const q = String(url.searchParams.get("q") || "").trim();
    const rows = q
      ? await env.DB.prepare("SELECT * FROM profiles WHERE banned = 0 AND lower(name) LIKE ? ORDER BY last_seen DESC LIMIT 20").bind(`%${q.toLowerCase()}%`).all()
      : await env.DB.prepare("SELECT * FROM profiles WHERE banned = 0 ORDER BY last_seen DESC LIMIT 60").all();
    const hub = env.HUB.get(env.HUB.idFromName("hub"));
    const online = await hub.fetch("https://hub/online").then((r) => r.json()).catch(() => []);
    return json(request, { people: (rows.results || []).map((p) => ({ ...rowToProfile(p), online: online.includes(p.user_id) })) });
  }
  if (seg[0] === "people" && seg[1] && method === "GET") {
    const p = await env.DB.prepare("SELECT * FROM profiles WHERE user_id = ?").bind(seg[1]).first();
    if (!p) return fail(request, "Not found.", 404);
    return json(request, { person: rowToProfile(p) });
  }
  if (path === "/friends" && method === "GET") {
    const rows = await env.DB.prepare("SELECT * FROM friends WHERE a = ? OR b = ?").bind(who.id, who.id).all();
    const ids = (rows.results || []).map((f) => (f.a === who.id ? f.b : f.a));
    const people = {};
    if (ids.length) {
      const ps = await env.DB.prepare(`SELECT * FROM profiles WHERE user_id IN (${ids.map(() => "?").join(",")})`).bind(...ids).all();
      for (const p of ps.results || []) people[p.user_id] = rowToProfile(p);
    }
    const hub = env.HUB.get(env.HUB.idFromName("hub"));
    const online = await hub.fetch("https://hub/online").then((r) => r.json()).catch(() => []);
    const out = (rows.results || [])
      .map((f) => {
        const other = f.a === who.id ? f.b : f.a;
        const status = f.status === "accepted" ? "friend" : f.a === who.id ? "sent" : "incoming";
        return people[other] && { ...people[other], status, online: online.includes(other), dm: dmId(who.id, other) };
      })
      .filter(Boolean);
    return json(request, { friends: out });
  }
  if (path === "/friends" && method === "POST") {
    const target = await env.DB.prepare("SELECT * FROM profiles WHERE user_id = ? OR lower(name) = lower(?)").bind(String(body.userId || ""), String(body.name || "")).first();
    if (!target || target.user_id === who.id) return fail(request, "We couldn't find that person. Check the name.");
    if (await blocked(env, who.id, target.user_id)) return fail(request, "You can't add that person.");
    const existing = await env.DB.prepare("SELECT * FROM friends WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)").bind(who.id, target.user_id, target.user_id, who.id).first();
    if (existing && existing.status === "accepted") return fail(request, "You're already friends.");
    if (existing && existing.a === target.user_id) {
      await env.DB.prepare("UPDATE friends SET status = 'accepted' WHERE a = ? AND b = ?").bind(target.user_id, who.id).run();
      await notify(env, target.user_id, "friend", `${me.name} accepted your friend request`, "/chat/community?tab=friends");
      return json(request, { status: "friend" });
    }
    if (existing) return fail(request, "Friend request already sent.");
    await env.DB.prepare("INSERT INTO friends (a, b, status, created_at) VALUES (?, ?, 'pending', ?)").bind(who.id, target.user_id, now()).run();
    await notify(env, target.user_id, "friend", `${me.name} sent you a friend request`, "/chat/community?tab=friends");
    return json(request, { status: "sent" });
  }
  if (seg[0] === "friends" && seg[1] && method === "DELETE") {
    await env.DB.prepare("DELETE FROM friends WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)").bind(who.id, seg[1], seg[1], who.id).run();
    return json(request, { ok: true });
  }
  if (path === "/blocks" && method === "POST") {
    const id = String(body.userId || "");
    if (!id || id === who.id) return fail(request, "Pick someone to block.");
    await env.DB.prepare("INSERT OR IGNORE INTO blocks (user_id, blocked_id) VALUES (?, ?)").bind(who.id, id).run();
    await env.DB.prepare("DELETE FROM friends WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)").bind(who.id, id, id, who.id).run();
    return json(request, { ok: true });
  }

  // --- notifications
  if (path === "/notifications" && method === "GET") {
    const rows = await env.DB.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 40").bind(who.id).all();
    return json(request, { notifications: (rows.results || []).map((n) => ({ id: n.id, kind: n.kind, text: n.text, link: n.link, read: !!n.read, at: n.created_at })) });
  }
  if (path === "/notifications/read" && method === "POST") {
    await env.DB.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").bind(who.id).run();
    return json(request, { ok: true });
  }

  // --- admin: ban from chat, see reports
  if (seg[0] === "admin" && me.is_admin) {
    if (seg[1] === "reports" && method === "GET") {
      const rows = await env.DB.prepare("SELECT r.*, m.text, p.name FROM reports r LEFT JOIN messages m ON m.id = r.message_id LEFT JOIN profiles p ON p.user_id = r.user_id WHERE r.status = 'open' ORDER BY r.id DESC LIMIT 50").all();
      return json(request, { reports: rows.results || [] });
    }
    if (seg[1] === "ban" && method === "POST") {
      await env.DB.prepare("UPDATE profiles SET banned = ? WHERE user_id = ?").bind(body.banned === false ? 0 : 1, String(body.userId || "")).run();
      await env.DB.prepare("UPDATE reports SET status = 'done' WHERE user_id = ?").bind(String(body.userId || "")).run();
      return json(request, { ok: true });
    }
  }
  return fail(request, "Not found.", 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(request) });
    if (url.pathname === "/ws") {
      if (request.headers.get("upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
      const who = await whoIs(url.searchParams.get("token") || "");
      if (!who) return new Response("Sign in first", { status: 401 });
      const me = await profileOf(env, who);
      if (me.banned) return new Response("Not allowed", { status: 403 });
      const hub = env.HUB.get(env.HUB.idFromName("hub"));
      const headers = new Headers(request.headers);
      headers.set("x-user", who.id);
      return hub.fetch(new Request("https://hub/connect", { headers }));
    }
    if (!url.pathname.startsWith("/api/")) return new Response("Nebulux Chat", { headers: cors(request) });
    const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const who = await whoIs(token);
    if (!who) return fail(request, "Sign in to use Nebulux Chat.", 401);
    try {
      return await route(request, env, who);
    } catch (e) {
      return fail(request, "Something went wrong. Try again.", 500);
    }
  },
};

// Everyone's live connection. Hibernating WebSockets: free while nobody is sending anything.
export class Hub {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/connect") {
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1], [request.headers.get("x-user") || ""]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (url.pathname === "/online") {
      const ids = [...new Set(this.state.getWebSockets().flatMap((ws) => this.state.getTags(ws)))].filter(Boolean);
      return new Response(JSON.stringify(ids));
    }
    if (url.pathname === "/push") {
      const { event, to } = await request.json();
      this.send(event, to);
      return new Response("ok");
    }
    return new Response("Not found", { status: 404 });
  }
  send(event, to) {
    const data = JSON.stringify(event);
    const sockets = to ? to.flatMap((u) => this.state.getWebSockets(u)) : this.state.getWebSockets();
    for (const ws of sockets) {
      try {
        ws.send(data);
      } catch {
        // Gone: the runtime cleans it up.
      }
    }
  }
  async webSocketMessage(ws, raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    const [userId] = this.state.getTags(ws);
    if (msg.type === "typing" && typeof msg.channel === "string") {
      const pair = dmUsers(msg.channel);
      this.send({ type: "typing", channel: msg.channel, userId, name: String(msg.name || "").slice(0, 24) }, pair && pair.includes(userId) ? pair : pair ? [] : null);
    } else if (msg.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
    }
  }
  async webSocketClose(ws) {
    try {
      ws.close();
    } catch {
      // Already closed.
    }
  }
}
