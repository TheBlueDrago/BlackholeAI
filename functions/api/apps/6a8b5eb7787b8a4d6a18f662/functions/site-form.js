// Forms on published sites (cloudflare-lib/inbox.js).
//   Anyone (the published page): { action: "send", site, fields: [[label, value]], hp } -> { ok }
//   The site's owner or an admin: { action: "list" | "delete" | "clear", site, id? } -> { messages },
//   or { action: "count", site } -> { count, latest } (the new-messages badge)
// Published pages run in a sandbox with no origin of their own, so "send" answers any origin
// (no cookies or sign-in are involved); everything else needs the owner's sign-in.
import { json, badName, ownerOf, kvKey } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { isBlocked } from "../../../../../cloudflare-lib/reports.js";
import { allow, TOO_MANY } from "../../../../../cloudflare-lib/ratelimit.js";
import { cleanFields, addMessage, listMessages, removeMessage } from "../../../../../cloudflare-lib/inbox.js";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" };
const reply = (obj, status = 200) => {
  const res = json(obj, status);
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
  return res;
};

export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    const body = await request.json().catch(() => ({}));
    const site = String(body.site || "").trim().toLowerCase();
    if (!site || badName("site", site)) return reply({ error: "Unknown site." }, 400);
    const action = String(body.action || "send");

    if (action === "send") {
      if (body.hp) return reply({ ok: true }); // the trap field: a bot filled it in; say nothing
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      if (!(await allow(`site-form:${ip}`, 5, 600))) return reply({ error: TOO_MANY }, 429);
      if ((await kv.get(kvKey("site", site))) == null || (await isBlocked(kv, "site", site))) return reply({ error: "This site isn't taking messages." }, 404);
      const fields = cleanFields(body.fields);
      if (!fields) return reply({ error: "Nothing to send." }, 400);
      const r = await addMessage(kv, site, fields);
      return r.error ? reply(r, 429) : reply({ ok: true });
    }

    const user = await currentUser(request);
    if (!user) return reply({ error: "Please sign in." }, 401);
    if (user.role !== "admin" && (await ownerOf(request, kv, "site", site)) !== user.id) return reply({ error: "Only the site's owner can see its messages." }, 403);
    if (action === "list") return reply({ messages: await listMessages(kv, site) });
    if (action === "count") {
      const all = await listMessages(kv, site);
      return reply({ count: all.length, latest: all[0] ? all[0].at : null });
    }
    if (action === "delete") return reply({ messages: await removeMessage(kv, site, String(body.id || "") || "__none__") });
    if (action === "clear") return reply({ messages: await removeMessage(kv, site, "") });
    return reply({ error: "Unknown action." }, 400);
  } catch {
    return reply({ error: "Something went wrong. Please try again." }, 500);
  }
}
