// Moving from the old address (blackhole-ai-tech.com) to nebuluxai.com. Chats, website and game
// drafts, settings and the sign-in are kept in the browser per web address, so on their own they'd
// stay behind. "Move my chats" (components/DomainMove.jsx) opens nebuluxai.com/move in a new tab and
// hands everything over with postMessage, to that exact address only; the new tab accepts it only
// from the exact old address (pages/Move.jsx).
export const OLD_ORIGIN = "https://blackhole-ai-tech.com";
export const NEW_ORIGIN = "https://nebuluxai.com";
export const MOVED_KEY = "bh-moved-to-new-address";

// Things that only matter for the moment (reload guards, one-time screens) aren't moved.
const SKIP = /^(bh-update-reloads|blackhole-chunk-reload|bh-moved-to-new-address)$/;
// Chats are merged by id, so chats already made on the new address are kept too.
const CHATS = "infinity-ai-conversations";

export const isOldAddress = (host = globalThis.location?.hostname) => host === "blackhole-ai-tech.com" || host === "www.blackhole-ai-tech.com";

// -> { key: value } of everything worth moving.
export function collectForMove(store = globalThis.localStorage) {
  const out = {};
  try {
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && !SKIP.test(k)) out[k] = store.getItem(k);
    }
  } catch {
    // Storage blocked: nothing to move.
  }
  return out;
}

const parseList = (v) => {
  try {
    const a = JSON.parse(v || "[]");
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
};

// Writes what was moved into this address's storage without overwriting anything already here
// (except chats, which are merged). -> how many things were added.
export function applyMove(data, store = globalThis.localStorage) {
  if (!data || typeof data !== "object") return 0;
  let n = 0;
  for (const [k, v] of Object.entries(data)) {
    if (typeof k !== "string" || typeof v !== "string" || SKIP.test(k) || k.length > 200 || v.length > 5_000_000) continue;
    try {
      if (k === CHATS) {
        const mine = parseList(store.getItem(k));
        const ids = new Set(mine.map((c) => c && c.id));
        const extra = parseList(v).filter((c) => c && c.id && !ids.has(c.id));
        if (extra.length) {
          store.setItem(k, JSON.stringify([...mine, ...extra]));
          n += extra.length;
        }
      } else if (store.getItem(k) == null) {
        store.setItem(k, v);
        n++;
      }
    } catch {
      // Full or blocked: keep going with the rest.
    }
  }
  return n;
}
