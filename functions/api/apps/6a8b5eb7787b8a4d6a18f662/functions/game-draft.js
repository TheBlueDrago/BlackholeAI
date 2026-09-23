// Replaces Base44's hosted game-draft function (the Games Designer's server-side
// autosave). Base44 caps entity string fields at ~19.5 KB, so saving any real game
// inline in GameDraft.htmlUrl failed silently, and its file upload is metered. Drafts
// now live in the PUBLISHED_HTML KV namespace as "draft:<userId>" (values up to 25 MB).
// A user's old GameDraft row is still read once if they have no KV draft yet.
// Same contract as before: { action: "load" | "save" | "clear", ... }.
import { json, base44 } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";

const MAX_BYTES = 5 * 1024 * 1024;

async function legacyDraft(request, user) {
  try {
    const rows = await base44(request, "GET", "entities/GameDraft");
    const d = (Array.isArray(rows) ? rows : []).find((r) => r.created_by_id === user.id);
    if (!d) return null;
    let html = d.htmlUrl || "";
    if (/^https?:\/\//.test(html)) html = await fetch(html).then((r) => r.text());
    return { gameName: d.gameName, title: d.title || "", genre: d.genre || "io", html, userTurns: d.userTurns || [], projectId: d.projectId || "" };
  } catch {
    return null;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);
    const kv = env.PUBLISHED_HTML;
    const key = `draft:${user.id}`;
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "load") {
      const stored = await kv.get(key, "json");
      // A cleared draft is kept as a marker so the old Base44 draft doesn't come back.
      if (stored) return json({ draft: stored.cleared ? null : stored });
      return json({ draft: await legacyDraft(request, user) });
    }

    if (action === "save") {
      const draft = {
        gameName: String(body.gameName || "my-game"),
        title: String(body.title || ""),
        genre: String(body.genre || "io"),
        html: String(body.html || ""),
        userTurns: Array.isArray(body.userTurns) ? body.userTurns.map(String).slice(-50) : [],
        projectId: String(body.projectId || ""),
      };
      if (draft.html.length > MAX_BYTES) return json({ error: "Draft is too large to autosave." }, 413);
      // Skip identical saves: KV's free tier allows 1,000 writes a day.
      const serialized = JSON.stringify(draft);
      if ((await kv.get(key)) === serialized) return json({ ok: true, unchanged: true });
      await kv.put(key, serialized);
      return json({ ok: true });
    }

    if (action === "clear") {
      await kv.put(key, JSON.stringify({ cleared: true }));
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    return json({ error: (err && err.message) || "Draft error" }, 500);
  }
}
