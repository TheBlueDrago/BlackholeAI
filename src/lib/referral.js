import { base44 } from "@/api/base44Client";

// Invite links look like /register?ref=CODE. The code is remembered in this browser
// until the new user has signed up (email code or Google, which can leave the page),
// then reported once so their friend gets a reward to claim.
const KEY = "blackhole-ref";

export function captureReferral() {
  try {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code && /^[a-z0-9]{4,16}$/i.test(code)) localStorage.setItem(KEY, code.toLowerCase());
  } catch {}
}

export function hasPendingReferral() {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

// Set once a new user's referral counted, until they pick their own welcome bonus.
export const WELCOME_KEY = "blackhole-welcome-pending";

export async function claimPendingReferral() {
  let code = null;
  try {
    code = localStorage.getItem(KEY);
  } catch {}
  if (!code) return false;
  let joined = false;
  try {
    const r = await base44.functions.invoke("referrals", { action: "join", code });
    joined = !!r?.data?.ok;
  } catch {
    // Not eligible (existing account, own link, already referred) — nothing to retry.
  }
  try {
    localStorage.removeItem(KEY);
    if (joined) localStorage.setItem(WELCOME_KEY, "1");
  } catch {}
  return joined;
}

export function hasWelcomePending() {
  try {
    return !!localStorage.getItem(WELCOME_KEY);
  } catch {
    return false;
  }
}

export function clearWelcomePending() {
  try {
    localStorage.removeItem(WELCOME_KEY);
  } catch {}
}
