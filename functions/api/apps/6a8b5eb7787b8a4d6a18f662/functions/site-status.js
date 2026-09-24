// Site-wide notices. { } -> { paymentsPaused, note }; admins: { action: "set", paymentsPaused }.
// Payments run on Base44, whose monthly allowance can run out; while it's out an admin can
// switch on a notice so the Shop and checkout say buying is paused before anyone presses Buy.
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { logAdmin } from "../../../../../cloudflare-lib/audit.js";

const KEY = "site-status";

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === "set") {
      const user = await currentUser(request);
      if (!user) return json({ error: "Please sign in." }, 401);
      if (user.role !== "admin") return json({ error: "Admins only." }, 403);
      const status = { paymentsPaused: body.paymentsPaused === true, at: new Date().toISOString() };
      await kv.put(KEY, JSON.stringify(status));
      await logAdmin(kv, user, status.paymentsPaused ? "payments-paused" : "payments-resumed", {}, request);
      return json(status);
    }
    const status = (await kv.get(KEY, "json")) || {};
    return json({ paymentsPaused: status.paymentsPaused === true });
  } catch {
    return json({ paymentsPaused: false });
  }
}
