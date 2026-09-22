// Replaces Base44's hosted publish-site function. The hosted copy uploaded the HTML
// with integrations.Core.UploadFile, which is metered against Base44's monthly
// integration-credit quota, so once that quota ran out every publish failed with
// "You have reached the limit of integrations for this month". Like
// chatCompletion.js next to this file, this exact static path takes routing
// precedence over the catch-all proxy at functions/api/[[path]].js, and it ships
// with every Cloudflare Pages deploy instead of waiting on a Base44 redeploy.
//
// It stores the HTML inline in the PublishedSite entity through Base44's plain
// entity REST API (not metered), acting as the signed-in user so the entity's
// RLS applies and created_by_id is the publisher. get-site-html already serves
// inline HTML as well as older rows that still hold a file URL.
// Same contract the frontend expects: { name, html, ownerName } -> { ok, id }.
const BACKEND = "https://blackhole-ai.base44.app";
const APP_ID = "6a8b5eb7787b8a4d6a18f662";
const MAX_BYTES = 5 * 1024 * 1024;

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
    const ownerName = String(body.ownerName || "");
    if (!name || !html) return json({ error: "name and html required" }, 400);
    if (html.length > MAX_BYTES) {
      return json({ error: "Website is too large (over 5 MB). Make it smaller." }, 413);
    }

    const existing = await base44(request, "GET", `entities/PublishedSite?q=${encodeURIComponent(JSON.stringify({ name }))}`);
    const rows = Array.isArray(existing) ? existing : [];
    const mine = rows.find((s) => s.created_by_id === user.id);
    if (rows.length && !mine && user.role !== "admin") {
      return json({ error: "That name is taken. Try another." }, 409);
    }

    const target = mine || rows[0];
    const rec = target
      ? await base44(request, "PUT", `entities/PublishedSite/${target.id}`, { html, ownerName, hidden: false })
      : await base44(request, "POST", "entities/PublishedSite", { name, html, ownerName });
    return json({ ok: true, id: (rec && rec.id) || (target && target.id), republished: !!target });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not publish." }, err && err.status >= 400 && err.status < 500 ? err.status : 500);
  }
}
