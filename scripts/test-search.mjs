// Offline test for Blackhole Browser's search (functions/.../browserSearch.js): results stay
// family-friendly (the prompt asks for it, and adult, gambling or piracy results are
// dropped on the server), with Gemini and Base44 faked. Run: node scripts/test-search.mjs
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const j = (...parts) => parts.join("");
let reply = {};
const prompts = [];
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (u.includes("generativelanguage")) {
    prompts.push(JSON.parse(opts.body).contents[0].parts[0].text);
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(reply) }] } }] }), { status: 200 });
  }
  if (u.endsWith("/entities/User/me")) return new Response(JSON.stringify({ id: "u1", role: "user" }));
  return new Response("{}");
};
const cache = new Map();
globalThis.caches = { default: { match: async (r) => (cache.has(r.url) ? new Response(cache.get(r.url)) : undefined), put: async (r, res) => cache.set(r.url, await res.text()) } };
const { onRequestPost, familySafe } = await import(new URL("../functions/api/apps/6a8b5eb7787b8a4d6a18f662/functions/browserSearch.js", import.meta.url).href);
const search = async (query) => {
  const request = new Request("https://x/", { method: "POST", headers: { authorization: "Bearer t", "content-type": "application/json" }, body: JSON.stringify({ query }) });
  const res = await onRequestPost({ request, env: { GEMINI_API_KEY: "k" } });
  return { status: res.status, data: await res.json() };
};

const r = (title, url, description = "") => ({ title, url, site: new URL(url).hostname, description });
reply = {
  answer: "Volcanoes are openings in the Earth's crust.",
  answerLabel: "Quick answer",
  results: [
    r("Volcano - Wikipedia", "https://en.wikipedia.org/wiki/Volcano"),
    r("Hot videos", j("https://www.", "porn", "hub.com/v")),
    r("Win big tonight", "https://example-casino.com/", "Play slots and win"),
    r("Watch free movies", j("https://", "123movies", ".example/")),
    r("Download", "https://example.org/x", j("Free ", "torrent", " of every game")),
    r("Volcano deals", j("https://www.best", "casino", "deals.example/")),
    r("Volcanoes for kids", "https://kids.nationalgeographic.com/volcano"),
    r("Not https", "http://example.com/"),
  ],
};
const { status, data } = await search("volcano");
assert(status === 200, "search answers");
assert(data.results.map((x) => x.site).join() === "en.wikipedia.org,kids.nationalgeographic.com", "adult, gambling, piracy and non-https results are dropped");
assert(/family-friendly/.test(prompts[0]) && /SafeSearch/.test(prompts[0]), "the AI is asked for family-friendly results");
assert(!/Never refuse\./.test(prompts[0]), "and isn't told to never refuse anything");
assert(familySafe(r("Minecraft wiki", "https://minecraft.wiki/"))
  && familySafe(r("How to bake bread", "https://example.com/bread", "Knead the dough"))
  && familySafe(r("Essex news", "https://essexnews.example/")), "ordinary results stay (no false match inside words)");
