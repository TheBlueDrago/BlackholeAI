// Open from GitHub: a repo's page usually links its own style.css / script.js. The designer
// shows one self-contained page, so those files are put into the page itself (a linked
// stylesheet becomes a <style>, a script file an inline <script>). Addresses on other
// websites (https://…, //cdn…) are left alone. readFile(path) resolves the file's text, or "".

// "css/site.css" next to "pages/about.html" → "pages/css/site.css"; "../a.css" climbs up.
// -> the repo path, or "" for another website's address or one that climbs out of the repo.
export function repoPathOf(ref, pagePath) {
  const r = String(ref || "").trim().split(/[?#]/)[0];
  if (!r || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(r)) return "";
  const parts = r.startsWith("/") ? [] : pagePath.split("/").slice(0, -1);
  for (const seg of r.replace(/^\/+/, "").split("/")) {
    if (seg === "..") {
      if (!parts.length) return "";
      parts.pop();
    } else if (seg && seg !== ".") parts.push(seg);
  }
  let out = parts.join("/");
  try {
    out = decodeURIComponent(out);
  } catch {
    // Keep it as written.
  }
  return out;
}

const LINK = /<link\b[^>]*>/gi;
const SCRIPT = /<script\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi;
const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i")) || [])[1] || "";

// -> { html, inlined: [paths put in], missing: [paths not found] }
export async function inlineRepoFiles(html, pagePath, readFile) {
  const inlined = [];
  const missing = [];
  const jobs = [];
  const want = (ref) => {
    const path = repoPathOf(ref, pagePath);
    if (!path) return null;
    const job = { path, text: null };
    jobs.push(job);
    return job;
  };
  const links = [];
  for (const m of html.matchAll(LINK)) {
    const tag = m[0];
    if (!/\bstylesheet\b/i.test(attr(tag, "rel"))) continue;
    const job = want(attr(tag, "href"));
    if (job) links.push({ tag, job, media: attr(tag, "media") });
  }
  const scripts = [];
  for (const m of html.matchAll(SCRIPT)) {
    const job = want(m[2]);
    if (job) scripts.push({ tag: m[0], job, attrs: (m[1] + m[3]).replace(/\s+/g, " ").trim() });
  }
  await Promise.all(jobs.slice(0, 20).map(async (j) => (j.text = await readFile(j.path).catch(() => ""))));

  let out = html;
  for (const { tag, job, media } of links) {
    if (!job.text) {
      if (job.text === "") missing.push(job.path);
      continue;
    }
    // "</style" inside the CSS would end the tag early.
    const css = job.text.replace(/<\/style/gi, "<\\/style");
    out = out.replace(tag, () => `<style data-from="${job.path}"${media ? ` media="${media}"` : ""}>\n${css}\n</style>`);
    inlined.push(job.path);
  }
  for (const { tag, job, attrs } of scripts) {
    if (!job.text) {
      if (job.text === "") missing.push(job.path);
      continue;
    }
    const js = job.text.replace(/<\/script/gi, "<\\/script");
    out = out.replace(tag, () => `<script data-from="${job.path}"${attrs ? ` ${attrs}` : ""}>\n${js}\n</script>`);
    inlined.push(job.path);
  }
  return { html: out, inlined, missing };
}
