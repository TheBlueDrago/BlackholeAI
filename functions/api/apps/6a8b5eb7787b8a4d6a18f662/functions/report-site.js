// Public: a visitor reports a published site or game (see cloudflare-lib/reports.js).
// Body: { kind: "site"|"game", name, reason, details } -> { ok, duplicate }
// No sign-in needed — most visitors of a published site have no Blackhole account.
import { json, findByName } from "../../../../../cloudflare-lib/published.js";
import { REASONS, addReport } from "../../../../../cloudflare-lib/reports.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { allow, TOO_MANY } from "../../../../../cloudflare-lib/ratelimit.js";
import { filledByBot } from "../../../../../cloudflare-lib/honeypot.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.PUBLISHED_HTML) return json({ error: "Reporting isn't available right now." }, 500);
    const body = await request.json().catch(() => ({}));
    if (filledByBot(body)) return json({ ok: true, duplicate: false });
    const kind = body.kind === "game" ? "game" : "site";
    const name = String(body.name || "").toLowerCase().slice(0, 100);
    const reason = String(body.reason || "");
    if (!name) return json({ error: "Which site are you reporting?" }, 400);
    if (!REASONS[reason]) return json({ error: "Pick a reason." }, 400);
    const rows = await findByName(null, kind, name).catch(() => null);
    if (rows && !rows.length) return json({ error: `No published ${kind} is called "${name}".` }, 404);

    const user = request.headers.get("authorization") ? await currentUser(request).catch(() => null) : null;
    const who = (user && user.id) || request.headers.get("cf-connecting-ip") || "";
    if (!(await allow(`report:${who}`, 10, 3600))) return json({ error: TOO_MANY }, 429);
    const result = await addReport(env.PUBLISHED_HTML, { kind, name, reason, details: body.details, who });
    return json({ ok: true, duplicate: result === "duplicate" });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not send the report." }, 500);
  }
}
