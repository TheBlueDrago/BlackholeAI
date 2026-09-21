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
const BACKEND = "https://blackhole-ai.base44.app";

export async function onRequest(context) {
  const { request, params } = context;
  const path = Array.isArray(params.path) ? params.path.join("/") : (params.path || "");
  const url = new URL(request.url);
  const target = `${BACKEND}/api/${path}${url.search}`;

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

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: resHeaders,
  });
}
