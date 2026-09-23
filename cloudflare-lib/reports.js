// Abuse protection for published sites and games.
//
// - Visitors report a page from the "Report" link that functions/published/[kind]/[name].js
//   adds to it; the /report page sends it to the report-site function, which calls addReport.
// - Every open report lives in ONE KV key ("reports"), so a report costs one KV write
//   (the free tier allows 1,000/day) and the Monitor reads them all with one get.
//   Repeat reports of the same page from the same visitor are ignored without writing.
// - Admins hide a page with setBlocked: "blocked:<kind>:<name>" in KV makes the serving
//   function answer with a "removed" page instead of the HTML, and the entity is marked
//   hidden so it drops out of the Blackhole Browser / Games front.
// - Pages with phishing forms are refused at publish time (see phishing.js).
import { ENTITY, kvKey, base44, findByName, publishedUrl } from "./published.js";
import { setShowcase } from "./showcase.js";

export const REASONS = {
  phishing: "Phishing or stealing passwords",
  scam: "Scam or fake store",
  malware: "Malware or harmful downloads",
  adult: "Adult or violent content",
  hate: "Hate or harassment",
  copyright: "Copyright or impersonation",
  other: "Something else",
};
const REPORTS_KEY = "reports";
const MAX_PAGES = 200; // reported pages kept (oldest dropped)
const MAX_PER_PAGE = 20; // individual reports kept per page
// Reports are anonymous, so cap their KV writes: the 1,000 writes/day free quota is
// shared with credits, and a flood of reports must not use it up. Past these caps a
// report is accepted but not stored (the page is flagged well before then).
const DAILY_WRITES = 100; // all reports together, per UTC day
const DAILY_PER_REPORTER = 5; // per visitor (IP or account), per UTC day
export const blockedKey = (kind, name) => `blocked:${kvKey(kind, name)}`;

async function sha(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// { "<kind>:<name>": page, ... } plus the "_day" counters used for the daily caps.
async function readAll(kv) {
  try {
    const v = await kv.get(REPORTS_KEY, "json");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

// Just the reported pages.
export async function readReports(kv) {
  const all = await readAll(kv);
  delete all._day;
  return all;
}

// Returns "added", "duplicate" or "limited". `who` identifies the reporter (IP, or
// user id) and is stored only as a short hash, to ignore repeats.
export async function addReport(kv, { kind, name, reason, details, who }) {
  const all = await readAll(kv);
  const id = kvKey(kind, name);
  const page = all[id] || { kind, name, reports: [], first: new Date().toISOString() };
  const by = await sha(`${id}|${who || ""}`);
  if (page.reports.some((r) => r.by === by)) return "duplicate";

  const today = new Date().toISOString().slice(0, 10);
  const day = all._day && all._day.date === today ? all._day : { date: today, n: 0, by: {} };
  const reporter = await sha(`reporter|${who || ""}`);
  if (day.n >= DAILY_WRITES || (day.by[reporter] || 0) >= DAILY_PER_REPORTER) return "limited";
  day.n += 1;
  day.by[reporter] = (day.by[reporter] || 0) + 1;
  all._day = day;

  page.reports = [
    ...page.reports,
    { by, reason, details: String(details || "").slice(0, 500), at: new Date().toISOString() },
  ].slice(-MAX_PER_PAGE);
  page.count = (page.count || 0) + 1;
  page.last = new Date().toISOString();
  all[id] = page;
  const ids = Object.keys(all).filter((k) => k !== "_day");
  if (ids.length > MAX_PAGES) {
    ids.sort((a, b) => String(all[a].last).localeCompare(String(all[b].last)));
    for (const old of ids.slice(0, ids.length - MAX_PAGES)) delete all[old];
  }
  await kv.put(REPORTS_KEY, JSON.stringify(all));
  return "added";
}

export async function dismissReports(kv, kind, name) {
  const all = await readAll(kv);
  if (!all[kvKey(kind, name)]) return;
  delete all[kvKey(kind, name)];
  await kv.put(REPORTS_KEY, JSON.stringify(all));
}

export async function isBlocked(kv, kind, name) {
  try {
    return (await kv.get(blockedKey(kind, name))) != null;
  } catch {
    return false;
  }
}

// Hides (blocked=true) or restores a page. `request` must carry an admin's token, since
// it updates the Base44 entity as that admin.
export async function setBlocked(kv, request, kind, name, blocked) {
  const rows = await findByName(request, kind, name);
  const rec = rows[0];
  if (blocked) {
    // Pages published before HTML moved to KV are still read from the entity's own
    // html (inline, or a Base44 file URL), which the block flag can't reach. Copy them
    // into KV once and point the entity here, so hiding works for them too.
    if (rec && rec.html && (await kv.get(kvKey(kind, name))) == null) {
      let html = rec.html;
      if (/^https?:\/\//.test(html) && !html.includes(`/published/${kind}/`)) {
        html = await fetch(html).then((r) => (r.ok ? r.text() : ""));
      }
      if (html && !/^https?:\/\//.test(html)) {
        await kv.put(kvKey(kind, name), html, { metadata: { owner: rec.created_by_id, updated: new Date().toISOString() } });
        await base44(request, "PUT", `entities/${ENTITY[kind]}/${rec.id}`, { html: publishedUrl(kind, name) });
      }
    }
    await kv.put(blockedKey(kind, name), new Date().toISOString());
    if (kind === "site") await setShowcase(kv, name, null);
  } else {
    await kv.delete(blockedKey(kind, name));
  }
  if (rec) await base44(request, "PUT", `entities/${ENTITY[kind]}/${rec.id}`, { hidden: !!blocked });
  return !!rec;
}

export const KINDS = Object.keys(ENTITY);
