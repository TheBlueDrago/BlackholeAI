// Refer-a-friend. Every user gets a short code (link: /register?ref=CODE). When a brand
// new account signs up through it, the referrer gets one reward of their choice for that
// referral — 25 Blackhole AI, 15 Blackhole Code, 10 Galaxy or 5 Space credits — added
// to their server-side bonus balance (see credits.js). Admins can take a referral back,
// which removes its credits again.
//
// KV keys (PUBLISHED_HTML namespace):
//   refcode:<code>        -> referrer's user id
//   refcodeof:<userId>    -> their code
//   referrals:<userId>    -> [{ id, name, at, reward: {tier, amount} | null, revoked }]
//   referredby:<userId>   -> the referrer's user id (one referrer per account)
//   referredemail:<email> -> 1 (an email can only ever be referred once)
import { adjustBonus } from "./credits.js";

export const REWARDS = { ai: 25, aiCode: 15, galaxy5: 10, space5: 5 };
export const APP_ORIGIN = "https://blackhole-ai-tech.com";
// Only accounts created this recently can be counted as referred, so existing users
// can't claim they were referred by opening a friend's link.
const NEW_ACCOUNT_MS = 3 * 24 * 60 * 60 * 1000;

const CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
const randomCode = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
};

async function getJSON(kv, key, fallback) {
  try {
    const v = await kv.get(key, "json");
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

// Shown to the referrer: first name and a masked email, never the full address.
function displayName(user) {
  const first = String(user.full_name || "").trim().split(/\s+/)[0];
  const email = String(user.email || "");
  const at = email.indexOf("@");
  const masked = at > 0 ? `${email[0]}${"•".repeat(Math.min(5, Math.max(1, at - 1)))}${email.slice(at)}` : "";
  return first ? `${first} (${masked})` : masked || "New user";
}

export async function referralCode(kv, userId) {
  const existing = await kv.get(`refcodeof:${userId}`);
  if (existing) return existing;
  for (let i = 0; i < 5; i++) {
    const code = randomCode();
    if (await kv.get(`refcode:${code}`)) continue;
    await kv.put(`refcode:${code}`, userId);
    await kv.put(`refcodeof:${userId}`, code);
    return code;
  }
  throw new Error("Could not create a referral code. Try again.");
}

export const referralLink = (code) => `${APP_ORIGIN}/register?ref=${code}`;

export async function listReferrals(kv, userId) {
  return getJSON(kv, `referrals:${userId}`, []);
}

// Called by the new user after signing up through someone's link.
export async function joinWithCode(kv, user, rawCode) {
  const code = String(rawCode || "").trim().toLowerCase();
  if (!/^[a-z0-9]{4,16}$/.test(code)) return { ok: false, reason: "Invalid referral code." };
  const referrerId = await kv.get(`refcode:${code}`);
  if (!referrerId) return { ok: false, reason: "Unknown referral code." };
  if (referrerId === user.id) return { ok: false, reason: "You can't refer yourself." };
  if (await kv.get(`referredby:${user.id}`)) return { ok: false, reason: "Already referred." };
  const email = String(user.email || "").trim().toLowerCase();
  if (email && (await kv.get(`referredemail:${email}`))) return { ok: false, reason: "This email was already referred." };
  const created = user.created_date ? new Date(user.created_date.endsWith("Z") ? user.created_date : `${user.created_date}Z`) : null;
  if (!created || Date.now() - created.getTime() > NEW_ACCOUNT_MS) {
    return { ok: false, reason: "Referral links only work for brand-new accounts." };
  }

  const list = await listReferrals(kv, referrerId);
  if (!list.some((r) => r.id === user.id)) {
    list.push({ id: user.id, name: displayName(user), at: new Date().toISOString(), reward: null, revoked: false });
    await kv.put(`referrals:${referrerId}`, JSON.stringify(list));
  }
  await kv.put(`referredby:${user.id}`, referrerId);
  if (email) await kv.put(`referredemail:${email}`, "1");
  return { ok: true };
}

// The referrer picks which AI's credits a referral gives them.
export async function claimReward(kv, request, referrer, referredId, tier) {
  if (!(tier in REWARDS)) throw new Error("Pick one of the rewards.");
  const list = await listReferrals(kv, referrer.id);
  const r = list.find((x) => x.id === referredId);
  if (!r) throw new Error("Referral not found.");
  if (r.revoked) throw new Error("This referral was removed.");
  if (r.reward) throw new Error("You already claimed this reward.");
  r.reward = { tier, amount: REWARDS[tier], at: new Date().toISOString() };
  await kv.put(`referrals:${referrer.id}`, JSON.stringify(list));
  await adjustBonus(kv, request, referrer, tier, REWARDS[tier]);
  return list;
}

// Admin: take a referral back and remove whatever of its credits are still unspent.
export async function revokeReferral(kv, request, referrer, referredId) {
  const list = await listReferrals(kv, referrer.id);
  const r = list.find((x) => x.id === referredId);
  if (!r) throw new Error("Referral not found.");
  if (r.revoked) return list;
  r.revoked = true;
  r.revokedAt = new Date().toISOString();
  await kv.put(`referrals:${referrer.id}`, JSON.stringify(list));
  if (r.reward) await adjustBonus(kv, request, referrer, r.reward.tier, -r.reward.amount);
  return list;
}
