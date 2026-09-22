// Shared by the Cloudflare Pages functions that publish and serve website/game HTML.
// Lives outside functions/ so Pages doesn't turn it into a route.
//
// Why KV: Base44 caps each entity string field at ~19.5 KB (and silently drops
// undeclared fields), and its file upload is metered against the monthly
// integration quota. So the full HTML goes into the PUBLISHED_HTML KV namespace
// (bound to the nebuluxai Pages project in the Cloudflare dashboard), and the
// Base44 entity's `html` field holds a short URL to /published/<kind>/<name>.
// Base44's get-site-html/get-game-html already fetch `html` when it's a URL, so
// every reader (designer, browser, games front, subdomain Worker) keeps working.
export const BACKEND = "https://blackhole-ai.base44.app";
export const APP_ID = "6a8b5eb7787b8a4d6a18f662";
export const PUBLIC_ORIGIN = "https://blackhole-ai-tech.com";
export const MAX_BYTES = 5 * 1024 * 1024;

export const ENTITY = { site: "PublishedSite", game: "PublishedGame" };

export function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json" },
  });
}

export const kvKey = (kind, name) => `${kind}:${name}`;

export const publishedUrl = (kind, name) => `${PUBLIC_ORIGIN}/published/${kind}/${encodeURIComponent(name)}?v=${Date.now()}`;

// Calls Base44's REST API, as the user who made `request` when it carries a token.
export async function base44(request, method, path, body) {
  const headers = { "X-App-Id": APP_ID, "content-type": "application/json" };
  const auth = request && request.headers.get("authorization");
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

export async function findByName(request, kind, name) {
  const rows = await base44(request, "GET", `entities/${ENTITY[kind]}?q=${encodeURIComponent(JSON.stringify({ name }))}`);
  return Array.isArray(rows) ? rows : [];
}

// The whole publish flow for both kinds; `extra` holds the kind-specific entity fields.
export async function publish(context, kind, { name, html, extra }) {
  const { request, env } = context;
  const label = kind === "site" ? "Website" : "Game";
  try {
    if (!env.PUBLISHED_HTML) {
      return json({ error: "Publishing storage isn't set up on this deployment (missing PUBLISHED_HTML KV binding)." }, 500);
    }
    let user;
    try {
      user = await base44(request, "GET", "entities/User/me");
    } catch {
      user = null;
    }
    if (!user || !user.id) return json({ error: "Please sign in to publish." }, 401);
    if (!name || !html) return json({ error: "name and html required" }, 400);
    if (new TextEncoder().encode(html).length > MAX_BYTES) {
      return json({ error: `${label} is too large (over 5 MB). Make it smaller.` }, 413);
    }

    const rows = await findByName(request, kind, name);
    const mine = rows.find((r) => r.created_by_id === user.id);
    if (rows.length && !mine && user.role !== "admin") {
      return json({ error: "That name is taken. Try another." }, 409);
    }

    await env.PUBLISHED_HTML.put(kvKey(kind, name), html, {
      metadata: { owner: user.id, updated: new Date().toISOString() },
    });

    const data = { ...extra, html: publishedUrl(kind, name), hidden: false };
    const target = mine || rows[0];
    const rec = target
      ? await base44(request, "PUT", `entities/${ENTITY[kind]}/${target.id}`, data)
      : await base44(request, "POST", `entities/${ENTITY[kind]}`, { ...data, name });
    return json({ ok: true, id: (rec && rec.id) || (target && target.id), republished: !!target });
  } catch (err) {
    const status = err && err.status >= 400 && err.status < 500 ? err.status : 500;
    return json({ error: (err && err.message) || "Could not publish." }, status);
  }
}
