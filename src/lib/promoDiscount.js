// A discount promo code the person entered (in the Shop or on Billing), remembered for this
// browser tab so the Shop shows the lower prices and Billing sends it to checkout. The server
// checks it again at checkout (cloudflare-lib/promos.js), so this is only for display.
import { discountApplies } from "../../cloudflare-lib/discounts.js";

const KEY = "bh-promo-discount";

// -> { code, pct, target, label } or null
export function savedDiscount() {
  try {
    const d = JSON.parse(sessionStorage.getItem(KEY) || "null");
    return d && d.code && d.pct > 0 ? d : null;
  } catch {
    return null;
  }
}

export function saveDiscount(d) {
  try {
    if (d) sessionStorage.setItem(KEY, JSON.stringify(d));
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the code just has to be typed again on Billing.
  }
}

// The % a saved code takes off this product (0 when it doesn't apply).
export const promoPctFor = (d, productId) => (d && discountApplies(d.target, productId) ? d.pct : 0);
