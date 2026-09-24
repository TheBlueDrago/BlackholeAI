// Monitor → Admin log: the latest admin actions (see cloudflare-lib/audit.js). Admins only.
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { readAdminLog } from "../../../../../cloudflare-lib/audit.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user || user.role !== "admin") return json({ error: "Admins only." }, 403);
    return json({ entries: await readAdminLog(env.PUBLISHED_HTML) });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not load the admin log." }, 500);
  }
}
