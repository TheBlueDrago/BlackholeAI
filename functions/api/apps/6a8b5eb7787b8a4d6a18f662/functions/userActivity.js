// Replaces Base44's userActivity (Monitor → user detail). Admin only.
// { userId } -> { totalPrompts, sessions, minutesOnAi, firstSeen, lastSeen, recent }
// This month's activity comes from the KV usage record (credits.js charge()); older
// history from Base44's AiActivity table, which admins can still read directly.
import { json, base44 } from "../../../../../cloudflare-lib/published.js";
import { currentUser, activityOf } from "../../../../../cloudflare-lib/credits.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const me = await currentUser(request);
    if (!me) return json({ error: "Unauthorized" }, 401);
    if (me.role !== "admin") return json({ error: "Forbidden" }, 403);
    const body = await request.json().catch(() => ({}));
    const userId = String(body.userId || "");
    if (!userId) return json({ error: "userId is required" }, 400);

    const kvAct = await activityOf(env.PUBLISHED_HTML, userId);
    let old = [];
    try {
      const q = encodeURIComponent(JSON.stringify({ userId }));
      old = (await base44(request, "GET", `entities/AiActivity?q=${q}&sort=-created_date&limit=500`)) || [];
    } catch {
      old = [];
    }
    const recent = [
      ...((kvAct && kvAct.recent) || []).map((r, i) => ({ id: `kv${i}`, prompt: r.prompt, bucket: r.bucket, at: r.at })),
      ...old.map((a) => ({ id: a.id, prompt: a.prompt, bucket: a.bucket, at: a.created_date })),
    ]
      .sort((a, b) => String(b.at).localeCompare(String(a.at)))
      .slice(0, 5);
    const oldTimes = old.map((a) => a.created_date).filter(Boolean).sort();
    const firstSeen = [oldTimes[0], kvAct && kvAct.first].filter(Boolean).sort()[0] || null;
    const lastSeen = [oldTimes[oldTimes.length - 1], kvAct && kvAct.last].filter(Boolean).sort().pop() || null;
    return json({
      totalPrompts: old.length + ((kvAct && kvAct.prompts) || 0),
      sessions: (kvAct && kvAct.sessions) || (old.length ? 1 : 0),
      minutesOnAi: Math.round((kvAct && kvAct.minutes) || 0),
      firstSeen,
      lastSeen,
      recent,
    });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not load activity." }, 500);
  }
}
