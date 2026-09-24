// Offline test for Monitor's message activity (functions/monitor-activity.js and the per-day
// count in cloudflare-lib/credits.js). Run: node scripts/test-monitor-activity.mjs
import { onRequestPost } from "../functions/api/apps/6a8b5eb7787b8a4d6a18f662/functions/monitor-activity.js";

let failed = 0;
const assert = (c, m) => {
  console.log((c ? "ok " : "FAIL ") + m);
  if (!c) failed++;
};
const now = new Date();
const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
const today = now.toISOString().slice(0, 10);
const store = new Map([
  [`usage:u1:${month}`, JSON.stringify({ ai: 3, activity: { prompts: 3, days: { [today]: 3 }, last: now.toISOString(), recent: [{ prompt: "hello", at: now.toISOString() }] } })],
  [`usage:u2:${month}`, JSON.stringify({ ai: 1, activity: { prompts: 2, days: { [today]: 2 }, last: now.toISOString(), recent: [{ prompt: "homework help", at: now.toISOString() }] } })],
  [`usage:u3:2020-01`, JSON.stringify({ activity: { days: { "2020-01-05": 9 } } })],
  [`grant:u1`, "{}"],
]);
const kv = {
  get: async (k, t) => (store.has(k) ? (t === "json" ? JSON.parse(store.get(k)) : store.get(k)) : null),
  list: async ({ prefix }) => ({ keys: [...store.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }),
};
let me = { id: "boss", role: "admin" };
globalThis.fetch = async () => new Response(JSON.stringify(me));
const call = async () => {
  const res = await onRequestPost({ request: new Request("https://x/", { method: "POST", headers: { authorization: "Bearer t" }, body: "{}" }), env: { PUBLISHED_HTML: kv } });
  return { status: res.status, data: await res.json() };
};
const r = await call();
assert(r.status === 200 && r.data.days[today] === 5, "messages are added up across accounts per day");
assert(!r.data.days["2020-01-05"], "old months are left out");
assert(r.data.recent.length === 2 && r.data.recent.some((x) => x.userId === "u2" && x.prompt === "homework help"), "the latest questions come with the account that asked");
me = { id: "u1", role: "user" };
assert((await call()).status === 403, "only admins can see it");

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
