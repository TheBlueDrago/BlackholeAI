// Emails that must never get an automatic reply (see worker.js).
export function isAutomatic(from, headers) {
  const f = String(from || "").toLowerCase();
  if (!f || /(^|[.+_-])(no-?reply|do-?not-?reply|mailer-daemon|postmaster|bounce|notifications?)@/.test(f) || f.endsWith("@nebuluxai.com")) return true;
  const h = (k) => String(headers.get(k) || "").toLowerCase();
  if (h("auto-submitted") && h("auto-submitted") !== "no") return true;
  if (/bulk|list|junk/.test(h("precedence"))) return true;
  if (h("list-id") || h("list-unsubscribe") || h("x-autoreply") || h("x-autorespond")) return true;
  return false;
}
