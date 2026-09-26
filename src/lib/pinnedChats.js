// Pinned chats stay at the top of the chat list (components/Sidebar.jsx). Saved on this device,
// like the chats themselves.
const KEY = "bh-pinned-chats";
const MAX = 20;
const listeners = new Set();

export function pinnedIds(store = globalThis.localStorage) {
  try {
    const v = JSON.parse(store?.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function togglePin(id, store = globalThis.localStorage) {
  const cur = pinnedIds(store);
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur].slice(0, MAX);
  try {
    if (next.length) store?.setItem(KEY, JSON.stringify(next));
    else store?.removeItem(KEY);
  } catch {
    // Storage blocked: pins last until the page closes.
  }
  listeners.forEach((f) => f(next));
  return next;
}

export const onPinsChange = (f) => {
  listeners.add(f);
  return () => listeners.delete(f);
};

// Pinned first (most recently pinned on top), then the rest in their usual order.
export function withPinsFirst(conversations, pins) {
  const at = new Map(pins.map((id, i) => [id, i]));
  const pinned = conversations.filter((c) => at.has(c.id)).sort((a, b) => at.get(a.id) - at.get(b.id));
  return [...pinned, ...conversations.filter((c) => !at.has(c.id))];
}
