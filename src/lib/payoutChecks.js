// Checks before paying a site's creator for sales made on their site (Monitor → Site sales).
// Creators are paid by hand, so these catch the usual tricks: buying from your own site with a
// stolen card and cashing out the payout before the card's owner disputes the charge.
export const HOLD_DAYS = 14; // most card disputes come in the first couple of weeks
const DAY = 86400000;
const BIG_ORDER = 200;

const num = (v) => parseFloat(v || "0") || 0;
const clean = (e) => String(e || "").trim().toLowerCase();
const when = (iso) => {
  const t = Date.parse(/Z|[+-]\d\d:?\d\d$/.test(String(iso || "")) ? iso : `${iso}Z`);
  return Number.isFinite(t) ? t : 0;
};

// -> the reasons to hold this sale's payout (empty = fine to pay).
export function payoutWarnings(sale, sales, now = Date.now()) {
  const out = [];
  const buyer = clean(sale.buyerEmail);
  if (buyer && buyer === clean(sale.creatorEmail)) out.push("The buyer is the site's owner");
  const paid = when(sale.paidAt);
  if (!paid || now - paid < HOLD_DAYS * DAY) out.push(`Paid less than ${HOLD_DAYS} days ago`);
  if (buyer) {
    const sameDay = sales.filter((s) => clean(s.buyerEmail) === buyer && s.siteName === sale.siteName && Math.abs(when(s.paidAt) - paid) < DAY);
    if (sameDay.length >= 3) out.push(`${sameDay.length} orders from one buyer within a day`);
  }
  if (num(sale.gross) >= BIG_ORDER) out.push("Unusually large order");
  return out;
}

// Per creator: what's fine to pay now and what to hold. -> [{ creatorEmail, ready, hold, sales }]
export function payoutSummary(sales, now = Date.now()) {
  const by = new Map();
  for (const s of sales) {
    const key = clean(s.creatorEmail) || "(no email)";
    const row = by.get(key) || { creatorEmail: key, ready: 0, hold: 0, sales: 0 };
    if (payoutWarnings(s, sales, now).length) row.hold += num(s.creatorPayout);
    else row.ready += num(s.creatorPayout);
    row.sales += 1;
    by.set(key, row);
  }
  return [...by.values()].sort((a, b) => b.ready + b.hold - (a.ready + a.hold));
}
