// Is this account banned or blocked? Admins ban or block people with admin-grant, which writes
// the KV "grant:<user id>" record (only admins can). A user's own User row can also carry
// banned/blockedUntil, which only ever adds a block: people can edit their own row, so it
// can't lift one. No imports, so any function can use it without an import cycle.
export function blockedBy(user, grant, now = new Date()) {
  const until = (v) => !!(v && new Date(v) > now);
  return user.banned === true || until(user.blockedUntil) || !!(grant && (grant.banned === true || until(grant.blockedUntil)));
}

// One KV read. Admins are never blocked (so a mistake can't lock the owner out).
export async function accountBlocked(kv, user) {
  if (!user || user.role === "admin") return false;
  let grant = null;
  try {
    grant = kv ? await kv.get(`grant:${user.id}`, "json") : null;
  } catch {
    grant = null;
  }
  return blockedBy(user, grant);
}

export const BLOCKED_MESSAGE = "Your account has been blocked, so it can't do that right now. If you think this is a mistake, contact us.";
