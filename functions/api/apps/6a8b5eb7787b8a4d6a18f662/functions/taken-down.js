// Public: names of pages an admin took down, -> { site: [...], game: [...] }. Lists and search
// leave them out (owners can clear the hidden flag on their own records). One KV read.
import { json } from "../../../../../cloudflare-lib/published.js";
import { readTakenDown } from "../../../../../cloudflare-lib/reports.js";

export async function onRequest(context) {
  const t = await readTakenDown(context.env.PUBLISHED_HTML);
  return json({ site: t.site || [], game: t.game || [] });
}
