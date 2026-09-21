// Cloudflare Pages Function: proxies every /api/* request straight through to the
// real Base44 backend for this app. The frontend always calls same-origin relative
// paths (see src/api/base44Client.js, serverUrl: ''), and Cloudflare Pages itself is
// static-only with no knowledge of Base44's API, so without this every /api/* call
// would 405 (POST) or silently fall back to index.html (GET).
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
