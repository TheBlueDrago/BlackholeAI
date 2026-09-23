// Replaces Base44's delete-account. Deletes the signed-in user's own User record with
// their own login (no Base44 function, so it doesn't use the Base44 integration
// allowance); if Base44 doesn't allow that, falls back to the old Base44 function.
// Also remembers the address as deleted (check-email) and clears the user's KV records.
// The app calls delete-my-content first to remove their sites, games and drafts.
import { json, base44 } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);
    try {
      await base44(request, "DELETE", `entities/User/${encodeURIComponent(user.id)}`);
    } catch {
      await base44(request, "POST", "functions/delete-account", {});
    }
    const email = String(user.email || "").trim().toLowerCase();
    if (email) await kv.put(`deleted:${email}`, new Date().toISOString());
    for (const key of [`bonus:${user.id}`, `grant:${user.id}`, `welcome:${user.id}`, `draft:${user.id}`]) await kv.delete(key).catch(() => {});
    return json({ success: true });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not delete account" }, 500);
  }
}
