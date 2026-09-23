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

export async function claimPendingReferral() {
  let code = null;
  try {
    code = localStorage.getItem(KEY);
  } catch {}
  if (!code) return;
  try {
    await base44.functions.invoke("referrals", { action: "join", code });
  } catch {
    // Not eligible (existing account, own link, already referred) — nothing to retry.
  }
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
