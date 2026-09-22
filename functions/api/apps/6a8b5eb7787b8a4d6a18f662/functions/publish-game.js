// Replaces Base44's hosted publish-game function, for the same reason as
// publish-site.js next to this file: the hosted copy used the metered
// integrations.Core.UploadFile, so publishing failed with "You have reached the
// limit of integrations for this month" once that quota ran out. This static path
// takes routing precedence over the catch-all proxy at functions/api/[[path]].js
// and ships with every Cloudflare Pages deploy.
//
// It stores the HTML inline in the PublishedGame entity through Base44's plain
// entity REST API (not metered), acting as the signed-in user so RLS applies and
// created_by_id is the publisher. get-game-html serves inline HTML and older rows
// that still hold a file URL.
// Same contract the frontend expects: { name, html, title, genre, ownerName, plays? } -> { ok, id }.
const BACKEND = "https://blackhole-ai.base44.app";
const APP_ID = "6a8b5eb7787b8a4d6a18f662";
const MAX_BYTES = 5 * 1024 * 1024;
// Must match the genre enum in base44/entities/PublishedGame.jsonc, or the write is rejected.
const GENRES = ["io", "shooting", "horror", "action", "arcade", "puzzle", "racing", "sports", "adventure", "strategy"];

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json" },
  });
}

// Calls Base44's REST API as the user who made this request.
async function base44(request, method, path, body) {
  const headers = { "X-App-Id": APP_ID, "content-type": "application/json" };
  const auth = request.headers.get("authorization");
  if (auth) headers.authorization = auth;
  const res = await fetch(`${BACKEND}/api/apps/${APP_ID}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = (data && (data.message || data.detail || data.error)) || text || `Base44 returned ${res.status}`;
    const err = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function onRequestPost(context) {
  const { request } = context;
  try {
    let user;
    try {
      user = await base44(request, "GET", "entities/User/me");
    } catch {
      user = null;
    }
    if (!user || !user.id) return json({ error: "Please sign in to publish." }, 401);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }
    const name = String(body.name || "").toLowerCase();
    const html = String(body.html || "");
    const title = String(body.title || "");
    const genre = GENRES.includes(body.genre) ? body.genre : "io";
    const ownerName = String(body.ownerName || "");
    if (!name || !html) return json({ error: "name and html required" }, 400);
    if (html.length > MAX_BYTES) {
      return json({ error: "Game is too large (over 5 MB). Make it smaller." }, 413);
    }

    const existing = await base44(request, "GET", `entities/PublishedGame?q=${encodeURIComponent(JSON.stringify({ name }))}`);
    const rows = Array.isArray(existing) ? existing : [];
    const mine = rows.find((g) => g.created_by_id === user.id);
    if (rows.length && !mine && user.role !== "admin") {
      return json({ error: "That name is taken. Try another." }, 409);
    }

    const data = { html, title, genre, ownerName, hidden: false };
    if (typeof body.plays === "number") data.plays = body.plays;
    const target = mine || rows[0];
    const rec = target
      ? await base44(request, "PUT", `entities/PublishedGame/${target.id}`, data)
      : await base44(request, "POST", "entities/PublishedGame", { ...data, name });
    return json({ ok: true, id: (rec && rec.id) || (target && target.id) });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not publish." }, err && err.status >= 400 && err.status < 500 ? err.status : 500);
  }
}
