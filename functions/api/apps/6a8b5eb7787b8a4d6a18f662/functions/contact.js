// The /contact page (see cloudflare-lib/contact.js).
// Anyone:  { action: "send", topic, message, email? } -> { ok }
// Admins:  { action: "list" } -> { messages }, { action: "done", id } -> { messages }
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { allow, TOO_MANY } from "../../../../../cloudflare-lib/ratelimit.js";
import { TOPICS, addMessage, listMessages, removeMessage } from "../../../../../cloudflare-lib/contact.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    if (!kv) return json({ error: "Messages aren't available right now." }, 500);
    const body = await request.json().catch(() => ({}));
    const user = request.headers.get("authorization") ? await currentUser(request) : null;

    if (body.action === "list" || body.action === "done") {
      if (!user || user.role !== "admin") return json({ error: "Admins only." }, 403);
      if (body.action === "done") await removeMessage(kv, String(body.id || ""));
      return json({ messages: await listMessages(kv) });
    }

    const topic = TOPICS[body.topic] ? body.topic : "other";
    const message = String(body.message || "").trim();
    const email = String(body.email || (user && user.email) || "").trim();
    if (message.length < 5) return json({ error: "Please write a little more." }, 400);
    if (!user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Add an email address so we can reply." }, 400);
    const who = (user && user.id) || request.headers.get("cf-connecting-ip") || "";
    if (!(await allow(`contact:${who}`, 5, 3600))) return json({ error: TOO_MANY }, 429);
    await addMessage(kv, { topic, message, email, userId: user && user.id, name: user && (user.full_name || ""), who });
    return json({ ok: true });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not send the message." }, 500);
  }
}
