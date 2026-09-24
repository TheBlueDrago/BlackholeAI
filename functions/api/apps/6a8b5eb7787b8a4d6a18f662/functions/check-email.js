// Replaces Base44's check-email, which sign-up calls first. When the Base44 allowance ran
// out it failed with 402 and sign-up broke with it. { email } -> { status }
//   "deleted"   — this address belonged to an account that was deleted (deleted:<email> in KV)
//   "available" — otherwise; Base44's own register step still refuses an existing account.
import { json } from "../../../../../cloudflare-lib/published.js";
import { allow, TOO_MANY } from "../../../../../cloudflare-lib/ratelimit.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    // Anyone can ask (it runs before sign-up), so it's limited per network instead of per account.
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    if (!(await allow(`check-email:${ip}`, 60, 3600))) return json({ status: "invalid", error: TOO_MANY }, 429);
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return json({ status: "invalid" }, 400);
    const deleted = await env.PUBLISHED_HTML.get(`deleted:${email}`);
    return json({ status: deleted ? "deleted" : "available" });
  } catch {
    return json({ status: "available" });
  }
}
