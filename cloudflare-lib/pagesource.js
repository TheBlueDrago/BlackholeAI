// Which published page to serve for a name, for get-site-html and get-game-html.
//
// Anyone signed in can create or edit their own PublishedSite/PublishedGame rows directly
// through Base44's API (RLS allows it, because publishing runs with the user's own sign-in),
// which skips every check in publish(). So a record alone isn't trusted:
// - A page that went through publish() is in KV with its owner in the metadata. That copy is
//   served, with the owner's record; other rows with the same name (a copycat) are ignored.
// - A page that never did (older inline sites, or rows written directly) is served from the
//   record only if it has nothing that steals passwords or card numbers, no crypto miner and
//   no adult content; otherwise the visitor gets a "removed" page with the reason.
import { findByName, kvKey, MAX_BYTES } from "./published.js";
import { findCredentialForm, findCredentialLeak } from "./phishing.js";
import { scanPage } from "./scan.js";

const byAge = (a, b) => String(a.created_date || "").localeCompare(String(b.created_date || ""));

async function stored(kv, kind, name) {
  if (!kv) return null;
  try {
    if (kv.getWithMetadata) {
      const r = await kv.getWithMetadata(kvKey(kind, name));
      return r && r.value != null ? { html: r.value, owner: (r.metadata && r.metadata.owner) || null } : null;
    }
    const html = await kv.get(kvKey(kind, name));
    return html != null ? { html, owner: null } : null;
  } catch {
    return null;
  }
}

async function fromRecord(rec) {
  const ref = String(rec.html || "");
  if (!/^https?:\/\//.test(ref)) return ref; // inline
  if (!ref.startsWith("https://")) return "";
  try {
    const res = await fetch(ref);
    if (!res.ok) return "";
    const text = await res.text();
    return text.length > MAX_BYTES ? "" : text;
  } catch {
    return "";
  }
}

// -> null (nothing to serve), or { rec, html } or { rec, removed: "why" }.
export async function pageFor(request, kv, kind, name) {
  const rows = (await findByName(request, kind, name)).slice().sort(byAge);
  if (!rows.length) return null;
  const kvPage = await stored(kv, kind, name);
  if (kvPage) {
    // Published through the app: the owner's record, or (for copies saved before owners were
    // recorded) the oldest record, since a copycat can only come later.
    const rec = kvPage.owner ? rows.find((r) => r.created_by_id === kvPage.owner) : rows[0];
    if (!rec) return null; // the owner deleted theirs: a copycat record doesn't bring it back
    if (findCredentialForm(kvPage.html)) return { rec, removed: "It asks for passwords or card numbers and sends them to another website, which isn't allowed here." };
    return { rec, html: kvPage.html };
  }
  const rec = rows[0];
  const html = await fromRecord(rec);
  if (!html) return null;
  if (findCredentialForm(html) || findCredentialLeak(html)) {
    return { rec, removed: "It asks for passwords or card numbers and sends them to another website, which isn't allowed here." };
  }
  // Only the clear-cut refusals: the looser ones (swearing, a "harmful code" score that
  // compressed older games can trip) stay as Monitor flags for a person to judge.
  const serious = scanPage(html).block.filter((b) => b === "a crypto-mining script" || b === "adult content");
  if (serious.length) return { rec, removed: `It has ${serious.join(" and ")}, which isn't allowed here.` };
  return { rec, html };
}
