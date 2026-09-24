// At most NETWORK_LIMIT accounts made on one network (IP address) in NETWORK_WINDOW_DAYS days.
// Networks an admin uses are exempt (the owner's home), and only accounts made from
// NETWORK_LIMIT_START on count, so nobody who already had an account is blocked. Schools and
// phone carriers can put many people behind one address: an admin can let an account in with
// Unblock / unban in Monitor, which clears the limit for it.
export const NETWORK_LIMIT = 5;
export const NETWORK_WINDOW_DAYS = 30;
export const NETWORK_LIMIT_START = "2026-09-24T21:00:00Z";
const DAY = 86400000;

export const ipOf = (request) => String(request.headers.get("cf-connecting-ip") || "").trim();
const netKey = (ip) => `net:${ip}`;
const exemptKey = (ip) => `net-exempt:${ip}`;
const created = (user) => {
  const raw = String((user && user.created_date) || "");
  return Date.parse(/Z|[+-]\d\d:?\d\d$/.test(raw) ? raw : raw + "Z");
};

async function read(kv, key) {
  try {
    return await kv.get(key, "json");
  } catch {
    return null;
  }
}

// Accounts made on this network in the window, oldest first.
async function recent(kv, ip, now) {
  const rec = (await read(kv, netKey(ip))) || { accounts: [] };
  return (rec.accounts || []).filter((a) => now - Date.parse(a.at) < NETWORK_WINDOW_DAYS * DAY).sort((a, b) => a.at.localeCompare(b.at));
}

export async function networkExempt(kv, ip) {
  if (!ip) return true;
  try {
    return (await kv.get(exemptKey(ip))) != null;
  } catch {
    return true;
  }
}

// Before sign-up (check-email): is this network already at the limit?
export async function networkFull(kv, request, now = Date.now()) {
  const ip = ipOf(request);
  if (await networkExempt(kv, ip)) return false;
  return (await recent(kv, ip, now)).length >= NETWORK_LIMIT;
}

// When a signed-in account loads the app (record-email): remember it on this network, and say
// whether it's over the limit. Admins make their network exempt.
export async function noteAccount(kv, request, user, now = Date.now()) {
  const ip = ipOf(request);
  if (!ip || !user || !user.id) return { over: false };
  if (user.role === "admin") {
    if (!(await networkExempt(kv, ip))) await kv.put(exemptKey(ip), new Date(now).toISOString());
    return { over: false };
  }
  const made = created(user);
  if (!(made >= Date.parse(NETWORK_LIMIT_START)) || now - made > NETWORK_WINDOW_DAYS * DAY) return { over: false };
  if (await networkExempt(kv, ip)) return { over: false };
  let list = await recent(kv, ip, now);
  if (!list.some((a) => a.id === user.id)) {
    list = [...list, { id: user.id, at: new Date(made).toISOString() }].sort((a, b) => a.at.localeCompare(b.at)).slice(-50);
    await kv.put(netKey(ip), JSON.stringify({ accounts: list }), { expirationTtl: NETWORK_WINDOW_DAYS * 86400 });
  }
  return { over: list.findIndex((a) => a.id === user.id) >= NETWORK_LIMIT };
}
