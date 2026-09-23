// Offline test: attached images reach Gemini (with limits); free "internal" AI calls (chat titles) are held to the basic model, a
// short prompt and a per-user rate; normal calls are still charged. Run: node scripts/test-ai-internal.mjs
const F = new URL("../functions/api/apps/6a8b5eb7787b8a4d6a18f662/functions/", import.meta.url).pathname;
const models = [];
const bodies = [];
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (u.includes("generativelanguage")) {
    models.push(u.split("/models/")[1].split(":")[0]);
    bodies.push(JSON.parse(opts.body));
    const sse = 'data: {"candidates":[{"content":{"parts":[{"text":"My Title"}]}}]}\n\n';
    return new Response(sse, { status: 200, headers: { "content-type": "text/event-stream" } });
  }
  if (u.endsWith("/entities/User/me")) return new Response(JSON.stringify({ id: "u1", role: "user" }));
  if (u.includes("/entities/")) return new Response("[]");
  return new Response("{}");
};
const cache = new Map();
globalThis.caches = { default: { match: async (r) => (cache.has(r.url) ? new Response(cache.get(r.url)) : undefined), put: async (r, res) => cache.set(r.url, await res.text()) } };
const store = new Map();
const kv = { get: async (k, t) => (store.has(k) ? (t === "json" ? JSON.parse(store.get(k)) : store.get(k)) : null), put: async (k, v) => store.set(k, v), delete: async (k) => store.delete(k) };
const { onRequestPost } = await import(F + "chatCompletion.js");
const call = async (body) => {
  const r = await onRequestPost({ request: new Request("https://x/", { method: "POST", headers: { authorization: "Bearer t", "content-type": "application/json" }, body: JSON.stringify(body) }), env: { PUBLISHED_HTML: kv, GEMINI_API_KEY: "k" }, waitUntil: () => {} });
  return [r.status, await r.json().catch(() => ({}))];
};
let [s, b] = await call({ prompt: "Name this chat", internal: true, model: "claude-sonnet-5" });
console.log("internal ok:", s, b.content, "model used:", models.join(","));
[s, b] = await call({ prompt: "x".repeat(2000), internal: true });
console.log("long internal prompt:", s);
let last;
for (let i = 0; i < 30; i++) [last] = await call({ prompt: "t", internal: true });
console.log("after 31 internal calls:", last);
models.length = 0;
[s, b] = await call({ prompt: "hello", model: "automatic" });
console.log("normal call:", s, b.content, "charged:", b.charged, "model:", models.join(","), "usage keys:", [...store.keys()].filter((k) => k.startsWith("usage:")).length);

// ---- images ----
bodies.length = 0;
const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
[s, b] = await call({ prompt: "what is this?", images: [{ mimeType: "image/png", data: png }] });
const parts = bodies[0].contents[0].parts;
console.log("image call:", s, "parts:", parts.length, parts[1].inline_data.mime_type, parts[1].inline_data.data === png);
[s, b] = await call({ prompt: "x", images: [{ mimeType: "text/html", data: "PGh0bWw+" }] });
console.log("bad image type:", s, b.error);
[s, b] = await call({ prompt: "x", images: [1, 2, 3, 4].map(() => ({ mimeType: "image/png", data: png })) });
console.log("too many images:", s, b.error);
bodies.length = 0;
cache.clear();
[s, b] = await call({ prompt: "Name it", internal: true, images: [{ mimeType: "image/png", data: png }] });
console.log("internal ignores images:", s, bodies[0] ? bodies[0].contents[0].parts.length : "throttled");
