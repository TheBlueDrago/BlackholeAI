// Offline test: moving chats, drafts and settings from the old address to nebuluxai.com
// (src/lib/domainMove.js). Run: node scripts/test-domain-move.mjs
import { collectForMove, applyMove, isOldAddress } from "../src/lib/domainMove.js";
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const mk = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { m, get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
};
const old = mk({
  "infinity-ai-conversations": JSON.stringify([{ id: "a", title: "Homework" }, { id: "b", title: "Poem" }]),
  "infinity-ai-designer": "{\"siteName\":\"joes\"}",
  "base44_access_token": "tok",
  "bh-update-reloads": "[1]",
});
const data = collectForMove(old);
assert(data["infinity-ai-designer"] && data.base44_access_token && !data["bh-update-reloads"], "chats, drafts and sign-in are collected; one-moment things aren't");
const fresh = mk({ "infinity-ai-conversations": JSON.stringify([{ id: "c", title: "New here" }]), "infinity-ai-designer": "{\"siteName\":\"mine\"}" });
const n = applyMove(data, fresh);
const chats = JSON.parse(fresh.getItem("infinity-ai-conversations")).map((c) => c.id).join();
assert(chats === "c,a,b", "chats are merged: the new address's chat stays, the old ones are added");
assert(fresh.getItem("infinity-ai-designer") === "{\"siteName\":\"mine\"}", "something already on the new address isn't overwritten");
assert(fresh.getItem("base44_access_token") === "tok" && n === 3, "the rest is added (you stay signed in)");
assert(applyMove(data, fresh) === 0, "moving twice adds nothing twice");
assert(applyMove("nope", fresh) === 0 && applyMove({ k: 5 }, fresh) === 0, "junk is ignored");
assert(isOldAddress("blackhole-ai-tech.com") && isOldAddress("www.blackhole-ai-tech.com") && !isOldAddress("nebuluxai.com"), "knows which address is the old one");
