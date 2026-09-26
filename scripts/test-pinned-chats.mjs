// Offline test for pinned chats (src/lib/pinnedChats.js). Run: node scripts/test-pinned-chats.mjs
import { pinnedIds, togglePin, withPinsFirst, onPinsChange } from "../src/lib/pinnedChats.js";
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const m = new Map();
const store = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
const chats = ["a", "b", "c", "d"].map((id) => ({ id }));
let heard = null;
onPinsChange((p) => (heard = p));
assert(pinnedIds(store).length === 0 && withPinsFirst(chats, []).map((c) => c.id).join("") === "abcd", "nothing pinned: usual order");
togglePin("c", store);
togglePin("d", store);
assert(withPinsFirst(chats, pinnedIds(store)).map((c) => c.id).join("") === "dcab" && heard.join() === "d,c", "pinned chats go on top, newest pin first");
togglePin("d", store);
assert(pinnedIds(store).join() === "c", "pressing again unpins");
togglePin("c", store);
assert(!m.size, "no pins: nothing saved");
m.set("bh-pinned-chats", "not json");
assert(pinnedIds(store).length === 0, "bad saved data: no pins, no crash");
assert(withPinsFirst(chats, ["gone"]).length === 4, "a pinned chat that was deleted is ignored");
