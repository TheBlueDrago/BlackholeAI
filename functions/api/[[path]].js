// Cloudflare Pages Function: proxies every /api/* request straight through to the
// real Base44 backend for this app. The frontend always calls same-origin relative
// paths (see src/api/base44Client.js, serverUrl: ''), and Cloudflare Pages itself is
// static-only with no knowledge of Base44's API, so without this every /api/* call
// would 405 (POST) or silently fall back to index.html (GET).
//
// NOTE: Base44's GitHub integration auto-relocates anything under /functions into
// base44/functions/ on its own commits ("Migrate functions to base44/functions/
// directory") since it scans that folder name for its own serverless functions.
// Cloudflare Pages requires this exact file at functions/api/[[path]].js to work,
// so if it goes missing again after a Base44 auto-sync commit, restore it from
// base44/functions/api/[[path]]/entry.ts (same content, different required path).
//
// Sign-in, sign-up and password-reset calls are counted on the way through, so password
// or code guessing and repeated emails are refused with a 429 (cloudflare-lib/authlimit.js).
// The entry.ts copy above predates this: if you restore from it, add the authLimit import
// and call back (scripts/test-authlimit.mjs fails without them).
import { authLimit } from "../../cloudflare-lib/authlimit.js";

const BACKEND = "https://blackhole-ai.base44.app";

export async function onRequest(context) {
  const { request, params } = context;
  const path = Array.isArray(params.path) ? params.path.join("/") : (params.path || "");
  const url = new URL(request.url);
  const target = `${BACKEND}/api/${path}${url.search}`;
  // Only Base44's API is reachable through here: a path that climbs out of /api/ (../), or
  // has a part that would once decoded (..%2f), is refused instead of fetching some other
  // page of that host and serving it as if it came from this site.
  const odd = (Array.isArray(params.path) ? params.path : [path]).some((seg) => {
    let d = String(seg);
    try {
      d = decodeURIComponent(d);
    } catch {
      return true;
    }
    return d === "." || d === ".." || /[/\\]/.test(d); // no API address has these in a part
  });
  if (odd || !new URL(target).pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "content-type": "application/json" } });
  }

  const limited = await authLimit(request, path);
  if (limited) return limited;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const hasBody = !["GET", "HEAD"].includes(request.method);

  const res = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    duplex: hasBody ? "half" : undefined,
    redirect: "manual",
  });

  const resHeaders = new Headers(res.headers);
  resHeaders.delete("content-encoding");
  resHeaders.delete("content-length");
  // The browser takes each answer as the type Base44 says it is, never guessing (a JSON
  // answer can't be treated as a page or a script). _headers doesn't cover function answers.
  resHeaders.set("x-content-type-options", "nosniff");

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: resHeaders,
  });
}
