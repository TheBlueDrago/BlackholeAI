// Is this account banned or blocked? Admins ban or block people with admin-grant, which writes
// the KV "grant:<user id>" record (only admins can). A user's own User row can also carry
// banned/blockedUntil, which only ever adds a block: people can edit their own row, so it
// can't lift one. No imports, so any function can use it without an import cycle.
export function blockedBy(user, grant, now = new Date()) {
  const until = (v) => !!(v && new Date(v) > now);
  return (
    user.banned === true ||
    until(user.blockedUntil) ||
    !!(grant && (grant.banned === true || grant.removed === true || until(grant.blockedUntil)))
  );
}

// Signed up but never typed the code emailed to them. Only an explicit false counts (accounts
// from Google, or without the field, aren't held back); admins are never held back.
export const unverified = (user) => !!user && user.role !== "admin" && user.is_verified === false;

// An admin removed an account with this email: new accounts with it are blocked too.
export const removedEmailKey = (email) => `removed-email:${String(email || "").trim().toLowerCase()}`;
export async function emailRemoved(kv, email) {
  if (!kv || !email) return false;
  try {
    return (await kv.get(removedEmailKey(email))) != null;
  } catch {
    return false;
  }
}

// Admins are never blocked (so a mistake can't lock the owner out).
export async function accountBlocked(kv, user) {
  if (!user || user.role === "admin") return false;
  if (unverified(user)) return true;
  let grant = null;
  try {
    grant = kv ? await kv.get(`grant:${user.id}`, "json") : null;
  } catch {
    grant = null;
  }
  return blockedBy(user, grant) || (await emailRemoved(kv, user.email));
}

export const UNVERIFIED_MESSAGE = "Confirm your email first: enter the code we emailed you.";
export const BLOCKED_MESSAGE ="Your account has been blocked, so it can't do that right now. If you think this is a mistake, contact us.";
