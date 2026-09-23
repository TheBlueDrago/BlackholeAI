// Server-side credits. Credits used to be counted only in the user's browser
// (localStorage) and bonus balances were written back with updateMe, so anyone
// could reset or raise their own credits — and the AI endpoint didn't check at all.
// Now every AI call is authenticated and charged here, and the UI just displays
// the status this returns.
//
// Access follows credits, not plans: any AI can be used while the user has credits
// for it (from a plan, a referral reward, a promo code or an admin), and not without.
//
// Where each fact comes from (nothing a user can edit about themselves):
// - role "admin": Base44 enforces role itself (all entity RLS depends on it).
// - Paid plans: Base44Purchase rows with status "paid" (admin/service-only writes).
// - Team membership: Base44's my-team function (reads admin-only Team rows).
// - Admin grants / bans: "grant:<userId>" in KV, written only via admin-grant.
//   (User.plan / User.bonus / User.banned are NOT trusted — a user can set their own.)
// - Promo bonus credits: PromoRedemption rows (service-only writes), folded into
//   the server-owned "bonus:<userId>" balance once each.
// - Monthly usage: "usage:<userId>:<YYYY-MM>" and, for a team's shared Blackhole Code
//   pool, "teamusage:<teamId>:<YYYY-MM>".
// Stored in the PUBLISHED_HTML KV namespace (already bound to this Pages project)
// under their own key prefixes.
import { base44 } from "./published.js";

export const TIERS = ["ai", "aiCode", "galaxy5", "space5"];
export const TIER_OF_MODEL = { automatic: "ai", claude_sonnet_4_6: "aiCode", claude_opus_4_8: "galaxy5", "claude-sonnet-5": "space5" };
export const TIER_NAMES = { ai: "Blackhole AI", aiCode: "Blackhole Code", galaxy5: "Galaxy", space5: "Space" };

// Monthly allowance per plan (same numbers the app has always shown).
const PLAN_TOTALS = {
  free: { ai: 50, aiCode: 0, galaxy5: 0, space5: 0 },
  pro: { ai: 100, aiCode: 50, galaxy5: 50, space5: 50 },
  team: { ai: 150, aiCode: 100, galaxy5: 100, space5: 100 },
  secret: { ai: 150, aiCode: 100, galaxy5: 100, space5: 100 },
  admin: { ai: 150, aiCode: 100, galaxy5: 100, space5: 100 },
};
const RANK = { free: 0, pro: 1, team: 2, secret: 3, admin: 4 };

// Whole credits: 1 per started 10,000 characters of reply, times the effort level.
export const CHARS_PER_CREDIT = 10000;
export const EFFORT_MULT = { low: 1, medium: 1, high: 2, extra: 3, ultracode: 4 };
export const creditsFor = (text, effort) =>
  Math.max(1, Math.ceil(String(text || "").length / CHARS_PER_CREDIT)) * (EFFORT_MULT[effort] || 1);

const monthKey = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};
const q = (obj) => encodeURIComponent(JSON.stringify(obj));

async function getJSON(kv, key, fallback) {
  try {
    const v = await kv.get(key, "json");
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}
async function putJSON(kv, key, value) {
  try {
    await kv.put(key, JSON.stringify(value));
  } catch (err) {
    // KV's free tier allows 1,000 writes/day; don't fail the user's request over it.
    console.error("credits: KV write failed", key, String(err));
  }
}

export async function currentUser(request) {
  if (!request.headers.get("authorization")) return null;
  try {
    const u = await base44(request, "GET", "entities/User/me");
    return u && u.id ? u : null;
  } catch {
    return null;
  }
}

async function paidPlan(request, user) {
  try {
    const rows = await base44(request, "GET", `entities/Base44Purchase?q=${q({ appUserId: user.id })}`);
    let best = "free";
    for (const p of rows || []) if (p.status === "paid" && RANK[p.productId] > RANK[best]) best = p.productId;
    return best;
  } catch {
    return "free";
  }
}

// An admin looking at someone else: my-team only answers for the caller, so read the
// (admin-readable) Team rows directly.
async function teamInfoFor(request, user) {
  try {
    const owned = await base44(request, "GET", `entities/Team?q=${q({ ownerId: user.id })}`);
    let t = (owned || [])[0];
    if (!t && user.email) t = ((await base44(request, "GET", `entities/Team?q=${q({ memberEmails: String(user.email).toLowerCase() })}`)) || [])[0];
    if (t && t.status === "active") return { plan: "team", teamId: t.id };
  } catch {
    // No team.
  }
  return null;
}

async function teamInfo(request) {
  try {
    const r = await base44(request, "POST", "functions/my-team", {});
    const t = r && r.team;
    if (t && t.active && !t.isAdmin && t.id) return { plan: t.ownerPlan === "secret" ? "secret" : "team", teamId: t.id };
  } catch {
    // Not on a team, or my-team unavailable.
  }
  return null;
}

// Server-owned bonus balance: seeded from the admin snapshot, plus each promo redemption once.
async function syncBonus(kv, request, user, grant) {
  const key = `bonus:${user.id}`;
  let b = await getJSON(kv, key, null);
  let changed = false;
  if (!b) {
    b = { ai: 0, aiCode: 0, galaxy5: 0, space5: 0, applied: [] };
    if (grant && grant.bonus) for (const t of TIERS) b[t] = Math.max(0, Number(grant.bonus[t]) || 0);
    changed = true;
  }
  b.applied = b.applied || [];
  let reds = [];
  try {
    reds = (await base44(request, "GET", `entities/PromoRedemption?q=${q({ userId: user.id })}`)) || [];
  } catch {
    reds = [];
  }
  const since = (grant && grant.bonusAsOf) || "";
  for (const r of reds) {
    if (!r || !r.id || b.applied.includes(r.id)) continue;
    b.applied.push(r.id);
    changed = true;
    // Redemptions from before the snapshot are already in the seeded balance.
    if (since && r.redeemedAt && r.redeemedAt <= since) continue;
    const tier = TIERS.includes(r.aiModel) ? r.aiModel : "ai";
    b[tier] = (Number(b[tier]) || 0) + (Number(r.credits) || 0);
  }
  if (changed) await putJSON(kv, key, b);
  return b;
}

// `other: true` when an admin is computing this for another user (not the caller).
export async function entitlement(kv, request, user, { other = false } = {}) {
  const grant = await getJSON(kv, `grant:${user.id}`, null);
  const [paid, team, bonus] = await Promise.all([
    paidPlan(request, user),
    other ? teamInfoFor(request, user) : teamInfo(request),
    syncBonus(kv, request, user, grant),
  ]);
  let plan = "free";
  const consider = (p) => {
    if (p && RANK[p] > RANK[plan]) plan = p;
  };
  if (user.role === "admin") consider("admin");
  if (grant && grant.plan && !(grant.planExpiresAt && new Date(grant.planExpiresAt) < new Date())) consider(grant.plan);
  consider(paid);
  if (team) consider(team.plan);
  const now = new Date();
  const blocked =
    user.banned === true ||
    !!(grant && (grant.banned || (grant.blockedUntil && new Date(grant.blockedUntil) > now))) ||
    !!(user.blockedUntil && new Date(user.blockedUntil) > now);
  return { user, plan, teamId: team && (plan === "team" || plan === "secret") ? team.teamId : null, bonus, blocked };
}

export async function creditStatus(kv, ent) {
  const month = monthKey();
  const totals = PLAN_TOTALS[ent.plan] || PLAN_TOTALS.free;
  const usage = await getJSON(kv, `usage:${ent.user.id}:${month}`, {});
  const teamUsed = ent.teamId ? Number(await kv.get(`teamusage:${ent.teamId}:${month}`).catch(() => 0)) || 0 : null;
  const tiers = {};
  for (const t of TIERS) {
    const used = t === "aiCode" && teamUsed !== null ? teamUsed : Number(usage[t]) || 0;
    const bonus = Math.max(0, Number(ent.bonus[t]) || 0);
    // Same display rule the app always used: bonus credits add to the total.
    tiers[t] = { total: totals[t] + bonus, used, remaining: Math.max(0, totals[t] - used) + bonus };
  }
  return { plan: ent.plan, month, blocked: ent.blocked, tiers };
}

// Takes whole credits from the bonus balance first, then the monthly allowance
// (or the team's shared pool for Blackhole Code on a team plan).
export async function charge(kv, ent, tier, amount) {
  let left = Math.max(0, Math.ceil(amount));
  if (!left) return;
  const month = monthKey();
  const fromBonus = Math.min(Math.max(0, Number(ent.bonus[tier]) || 0), left);
  if (fromBonus > 0) {
    ent.bonus[tier] -= fromBonus;
    left -= fromBonus;
    await putJSON(kv, `bonus:${ent.user.id}`, ent.bonus);
  }
  if (left <= 0) return;
  if (tier === "aiCode" && ent.teamId) {
    const key = `teamusage:${ent.teamId}:${month}`;
    const cur = Number(await kv.get(key).catch(() => 0)) || 0;
    try {
      await kv.put(key, String(cur + left));
    } catch (err) {
      console.error("credits: KV write failed", key, String(err));
    }
    return;
  }
  const key = `usage:${ent.user.id}:${month}`;
  const usage = await getJSON(kv, key, {});
  usage[tier] = (Number(usage[tier]) || 0) + left;
  await putJSON(kv, key, usage);
}

// Adds (or with a negative delta, removes) bonus credits for one AI. Balances never go
// below zero. Used by referral rewards and by admins in the Monitor page.
export async function adjustBonus(kv, request, user, tier, delta) {
  if (!TIERS.includes(tier)) throw new Error("Unknown AI");
  const grant = await getJSON(kv, `grant:${user.id}`, null);
  const b = await syncBonus(kv, request, user, grant);
  b[tier] = Math.max(0, (Number(b[tier]) || 0) + Math.trunc(Number(delta) || 0));
  await putJSON(kv, `bonus:${user.id}`, b);
  return b;
}

// Admin-only: record plan grants, bans/blocks and (for the one-time snapshot) bonus balances.
export async function applyGrant(kv, userId, patch) {
  const key = `grant:${userId}`;
  const grant = await getJSON(kv, key, {});
  for (const f of ["plan", "planExpiresAt", "banned", "blockedUntil"]) if (f in patch) grant[f] = patch[f];
  if (patch.bonus && typeof patch.bonus === "object") {
    const b = { ai: 0, aiCode: 0, galaxy5: 0, space5: 0, applied: [] };
    for (const t of TIERS) b[t] = Math.max(0, Number(patch.bonus[t]) || 0);
    grant.bonus = { ...b };
    grant.bonusAsOf = new Date().toISOString();
    await putJSON(kv, `bonus:${userId}`, b);
  }
  await putJSON(kv, key, grant);
  return grant;
}
