// How many games a plan can publish per month, and how many websites it can keep in total.
// Deleting frees a slot, since limits are counted from what currently exists.
const GAME_LIMITS = { free: 1, pro: 3, team: 5, secret: 10, enterprise: 10, admin: 10 };
const SITE_LIMITS = { free: 1, pro: 3, team: 3, secret: 5, enterprise: 10, admin: 10 };

export const gameLimit = (plan) => GAME_LIMITS[plan] ?? 1;
export const siteLimit = (plan) => SITE_LIMITS[plan] ?? 1;

export function inThisMonth(date) {
  if (!date) return false;
  const d = new Date(date);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}