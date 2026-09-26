// Daily streak: how many days in a row someone has asked the AI something, shown in the chat
// as "🔥 3 days". Kept on this device, per account. Days are the person's local calendar days.
const key = (userId) => `bh-streak:${userId || "_"}`;
const listeners = new Set();

export const dayOf = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);

function read(userId, store) {
  try {
    const v = JSON.parse(store?.getItem(key(userId)) || "null");
    return v && typeof v.last === "string" && Number.isFinite(v.count) ? v : null;
  } catch {
    return null;
  }
}

// The streak as it stands today: 0 once a whole day was missed.
export function currentStreak(userId, today = dayOf(), store = globalThis.localStorage) {
  const v = read(userId, store);
  if (!v) return 0;
  const gap = daysBetween(v.last, today);
  return gap === 0 || gap === 1 ? v.count : 0;
}

// Called when a message is sent. -> the streak after it.
export function noteActivity(userId, today = dayOf(), store = globalThis.localStorage) {
  const v = read(userId, store);
  let count = 1;
  if (v) {
    const gap = daysBetween(v.last, today);
    if (gap === 0) return v.count;
    count = gap === 1 ? v.count + 1 : 1;
  }
  try {
    store?.setItem(key(userId), JSON.stringify({ last: today, count, best: Math.max(count, v?.best || 0) }));
  } catch {
    // Storage blocked: no streak.
  }
  listeners.forEach((f) => f(count));
  return count;
}

export const bestStreak = (userId, store = globalThis.localStorage) => read(userId, store)?.best || 0;

export const onStreak = (f) => {
  listeners.add(f);
  return () => listeners.delete(f);
};
