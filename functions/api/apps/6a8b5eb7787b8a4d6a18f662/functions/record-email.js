// Replaces Base44's record-email, which the app calls on every load. The Base44 version
// cost part of the Base44 integration allowance each time (and emailed admins); this one
// just remembers when an address was first seen, writing KV once per new user.
// It also applies the accounts-per-network limit (cloudflare-lib/networks.js): an account
// made past the limit on its network is blocked until an admin lets it in.
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser, applyGrant } from "../../../../../cloudflare-lib/credits.js";
import { noteAccount } from "../../../../../cloudflare-lib/networks.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user) return json({ ok: false }, 401);
    const email = String(user.email || "").trim().toLowerCase();
    if (!email) return json({ ok: false }, 400);
    const key = `seen:${email}`;
    const firstVisit = !(await env.PUBLISHED_HTML.get(key));
    if (firstVisit) await env.PUBLISHED_HTML.put(key, new Date().toISOString());
    // Checked on an account's first visit (one KV write per new account, not per load); an
    // admin's network is marked exempt whenever they load the app from a new one.
    if (firstVisit || user.role === "admin") {
      const { over } = await noteAccount(env.PUBLISHED_HTML, request, user);
      if (over) await applyGrant(env.PUBLISHED_HTML, user.id, { networkLimit: true });
    }
    return json({ ok: true });
  } catch {
    return json({ ok: false }, 500);
  }
}
