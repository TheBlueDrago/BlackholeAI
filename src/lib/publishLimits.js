// The plan limits live in cloudflare-lib/publishLimits.js, so the publish functions enforce
// the same numbers the app shows.
export { gameLimit, siteLimit } from "../../cloudflare-lib/publishLimits.js";

export function inThisMonth(date) {
  if (!date) return false;
  const d = new Date(date);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}
