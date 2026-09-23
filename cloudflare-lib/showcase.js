// The public gallery (/showcase) of published sites whose owners opted in. One KV key
// holds the whole list, so the gallery loads with one read and a write only happens
// when an owner turns their site on or off. Taking a site down (reports.js) removes it.
const KEY = "showcase";
export const MAX_SHOWCASE = 300;

export async function readShowcase(kv) {
  try {
    const v = await kv.get(KEY, "json");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

// entry = { owner, title } to add/update, or null to remove. Returns false when the
// gallery is full.
export async function setShowcase(kv, name, entry) {
  const all = await readShowcase(kv);
  if (!entry) {
    if (!all[name]) return true;
    delete all[name];
  } else {
    if (!all[name] && Object.keys(all).length >= MAX_SHOWCASE) return false;
    all[name] = { ...entry, added: (all[name] && all[name].added) || new Date().toISOString() };
  }
  await kv.put(KEY, JSON.stringify(all));
  return true;
}
