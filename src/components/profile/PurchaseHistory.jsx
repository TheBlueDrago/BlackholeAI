import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Receipt, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppShell } from "@/components/AppShellContext";

const money = (amount, currency) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
};
const day = (iso) => {
  const t = Date.parse(/Z|[+-]\d\d:?\d\d$/.test(String(iso || "")) ? iso : `${iso}Z`);
  return Number.isFinite(t) ? new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
};

// Settings → Subscriptions → Your purchases: what this account has paid for, from its own
// Base44Purchase records (only the payment functions can write them; people can read their own).
// Checkouts that were never paid aren't listed.
export default function PurchaseHistory() {
  const { currentUser } = useAppShell();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser?.id) return;
    base44.entities.Base44Purchase.filter({ appUserId: currentUser.id }, "-created_date", 50)
      .then((list) => setRows((list || []).filter((p) => p.status === "paid" || p.status === "canceled")))
      .catch(() => setError("Couldn't load your purchases right now."));
  }, [currentUser?.id]);

  return (
    <div className="mt-5">
      <p className="text-slate-300 text-sm font-medium inline-flex items-center gap-2">
        <Receipt className="w-4 h-4 text-slate-400" /> Your purchases
      </p>
      {error ? (
        <p className="text-xs text-slate-500 mt-2">{error}</p>
      ) : !rows ? (
        <Loader2 className="w-4 h-4 mt-2 animate-spin text-slate-500" />
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-500 mt-2">No purchases yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-700/50 rounded-xl border border-slate-700/50 bg-slate-800/40">
          {rows.map((p) => (
            <li key={p.id} className="px-3 py-2 flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0">
                <span className="block text-slate-200 truncate">
                  {p.productName || p.productId}
                  {p.quantity > 1 ? ` × ${p.quantity}` : ""}
                </span>
                <span className="block text-slate-500">
                  {day(p.paidAt || p.created_date)}
                  {p.status === "canceled" ? " · subscription ended" : ""}
                </span>
              </span>
              <span className="shrink-0 text-slate-200 font-medium">{money(p.amount, p.currency)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-slate-500 mt-2">
        A question about a payment? <Link to="/contact?topic=billing" className="underline hover:text-slate-300">Contact us</Link>.
      </p>
    </div>
  );
}
