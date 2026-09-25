// Offline test for form messages on published sites (cloudflare-lib/inbox.js,
// functions/.../site-form.js, pageserve.js withFormInbox). Run: node scripts/test-inbox.mjs
import { cleanFields, addMessage, PER_SITE_PER_DAY } from "../cloudflare-lib/inbox.js";
import { preparePage } from "../cloudflare-lib/pageserve.js";
import { onRequestPost, onRequestOptions } from "../functions/api/apps/6a8b5eb7787b8a4d6a18f662/functions/site-form.js";

let failed = 0;
const assert = (c, m) => {
  console.log((c ? "ok " : "FAIL ") + m);
  if (!c) failed++;
};

// What's kept.
const kept = cleanFields([["Name", "Sam"], ["Password", "hunter2"], ["Card number", "4242 4242 4242 4242"], ["Notes", "4111111111111111"], ["Phone", "555-1234"], ["Empty", ""]]);
assert(JSON.stringify(kept) === JSON.stringify([["Name", "Sam"], ["Phone", "555-1234"]]), "passwords, card numbers and empty fields are never kept");
assert(cleanFields([["Password", "x"]]) === null && cleanFields("nope") === null, "nothing to keep means nothing is sent");

// The script on published sites.
const page = preparePage("<!DOCTYPE html><html><body><form><input name=a></form></body></html>", "site", "rosas-bakery");
const scripts = [...page.matchAll(/<script data-bh>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const inbox = scripts.find((s) => s.includes("site-form"));
assert(!!inbox && inbox.includes('"rosas-bakery"'), "published sites get the form script with their name");
let parsed = true;
try {
  new Function(inbox);
} catch {
  parsed = false;
}
assert(parsed, "the form script is valid JavaScript");
assert(!preparePage("<html><body></body></html>", "game", "g").includes("site-form"), "games don't get it");

// The endpoint.
const m = new Map([["site:rosas-bakery", "<html>"]]);
const kv = {
  get: async (k, t) => (m.has(k) ? (t === "json" ? JSON.parse(m.get(k)) : m.get(k)) : null),
  put: async (k, v) => void m.set(k, String(v)),
  getWithMetadata: async (k) => ({ value: m.get(k) ?? null, metadata: m.has(k) ? { owner: "owner1" } : null }),
};
let me = null;
globalThis.fetch = async (url) => {
  const p = new URL(String(url)).pathname;
  if (p.endsWith("/entities/User/me")) return me ? new Response(JSON.stringify(me)) : new Response("{}", { status: 401 });
  if (p.includes("/entities/PublishedSite")) return new Response(JSON.stringify([{ id: "r", name: "rosas-bakery", created_by_id: "owner1", created_date: "2026-09-01" }]));
  return new Response("[]");
};
let ipN = 0;
const call = async (body, auth) => {
  const headers = { "content-type": "application/json", "cf-connecting-ip": `10.0.0.${++ipN}` };
  if (auth) headers.authorization = "Bearer t";
  const res = await onRequestPost({ request: new Request("https://x/", { method: "POST", headers, body: JSON.stringify(body) }), env: { PUBLISHED_HTML: kv } });
  return { status: res.status, cors: res.headers.get("access-control-allow-origin"), data: await res.json() };
};
const sent = await call({ action: "send", site: "rosas-bakery", fields: [["Name", "Sam"], ["Password", "x"]] });
assert(sent.status === 200 && sent.cors === "*", "a visitor's message is accepted from the published page");
assert((await call({ action: "send", site: "no-such-site", fields: [["a", "b"]] })).status === 404, "sites that don't exist take no messages");
m.set("blocked:site:rosas-bakery", "1");
assert((await call({ action: "send", site: "rosas-bakery", fields: [["a", "b"]] })).status === 404, "taken-down sites take no messages");
m.delete("blocked:site:rosas-bakery");
const before = JSON.parse(m.get("inbox:rosas-bakery")).length;
assert((await call({ action: "send", site: "rosas-bakery", fields: [["a", "b"]], hp: "bot" })).status === 200 && JSON.parse(m.get("inbox:rosas-bakery")).length === before, "a bot that fills the trap field is quietly ignored");
assert((await onRequestOptions()).headers.get("access-control-allow-methods").includes("POST"), "the browser's pre-check is answered");

assert((await call({ action: "list", site: "rosas-bakery" })).status === 401, "reading messages needs a sign-in");
me = { id: "someone-else", role: "user" };
assert((await call({ action: "list", site: "rosas-bakery" }, true)).status === 403, "only the owner can read them");
me = { id: "owner1", role: "user" };
const list = await call({ action: "list", site: "rosas-bakery" }, true);
assert(list.status === 200 && list.data.messages[0].fields.length === 1 && list.data.messages[0].fields[0][1] === "Sam", "the owner sees the message, without the password");
const del = await call({ action: "delete", site: "rosas-bakery", id: list.data.messages[0].id }, true);
assert(del.data.messages.length === 0, "the owner can delete a message");

// Daily cap per site.
const kv2 = { get: kv.get, put: kv.put };
m.set("inbox:busy", JSON.stringify(Array.from({ length: PER_SITE_PER_DAY }, (_, i) => ({ id: String(i), at: new Date().toISOString(), fields: [] }))));
assert(!!(await addMessage(kv2, "busy", [["a", "b"]])).error, `a site takes at most ${PER_SITE_PER_DAY} messages a day`);

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
