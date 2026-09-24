// Admin only: AI messages across all accounts for Monitor's Growth chart.
// {} -> { days: { "YYYY-MM-DD": count }, recent: [{ userId, prompt, at }] }
// Read from each account's monthly usage record (cloudflare-lib/credits.js charge()), which
// already keeps a per-day count and the start of that account's five latest questions (as the
// Privacy Policy says). This month and last month cover the chart's 14 days.
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";

const monthOf = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const me = await currentUser(request);
    if (!me) return json({ error: "Please sign in." }, 401);
    if (me.role !== "admin") return json({ error: "Admins only." }, 403);
    const kv = env.PUBLISHED_HTML;
    const now = new Date();
    const months = [monthOf(now), monthOf(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)))];

    const keys = [];
    let cursor;
    do {
      const page = await kv.list({ prefix: "usage:", cursor });
      for (const k of page.keys) if (months.some((m) => k.name.endsWith(`:${m}`))) keys.push(k.name);
      cursor = page.list_complete ? null : page.cursor;
    } while (cursor && keys.length < 5000);

    const days = {};
    const recent = [];
    const records = await Promise.all(keys.map((k) => kv.get(k, "json").catch(() => null)));
    records.forEach((rec, i) => {
      const a = rec && rec.activity;
      if (!a) return;
      const userId = keys[i].split(":")[1];
      if (a.days) for (const [d, n] of Object.entries(a.days)) days[d] = (days[d] || 0) + (Number(n) || 0);
      else if (a.last) days[a.last.slice(0, 10)] = (days[a.last.slice(0, 10)] || 0) + (Number(a.prompts) || 0);
      for (const r of a.recent || []) recent.push({ userId, prompt: String(r.prompt || ""), at: r.at });
    });
    recent.sort((x, y) => String(y.at).localeCompare(String(x.at)));
    return json({ days, recent: recent.slice(0, 300) });
  } catch (err) {
    return json({ error: "Couldn't load activity.", detail: String((err && err.message) || err) }, 500);
  }
}
