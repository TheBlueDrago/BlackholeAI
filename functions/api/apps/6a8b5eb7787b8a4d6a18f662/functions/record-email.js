// Replaces Base44's record-email, which the app calls on every load. The Base44 version
// cost part of the Base44 integration allowance each time (and emailed admins); this one
// just remembers when an address was first seen, writing KV once per new user.
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user) return json({ ok: false }, 401);
    const email = String(user.email || "").trim().toLowerCase();
    if (!email) return json({ ok: false }, 400);
    const key = `seen:${email}`;
    if (!(await env.PUBLISHED_HTML.get(key))) await env.PUBLISHED_HTML.put(key, new Date().toISOString());
    return json({ ok: true });
  } catch {
    return json({ ok: false }, 500);
  }
}
