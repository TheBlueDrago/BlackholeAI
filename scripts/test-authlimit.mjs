// Offline test for the sign-in / sign-up limits in the /api proxy (cloudflare-lib/authlimit.js,
// functions/api/[[path]].js): guessing is refused with a 429 before it reaches Base44,
// everything else passes straight through with its body untouched.
// Run: node scripts/test-authlimit.mjs
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};

// The edge cache ratelimit.js counts in, and Base44 behind the proxy.
const cache = new Map();
let cacheBroken = false;
globalThis.caches = {
  default: {
    match: async (r) => {
      if (cacheBroken) throw new Error("cache down");
      return cache.has(r.url) ? new Response(cache.get(r.url)) : undefined;
    },
    put: async (r, res) => cache.set(r.url, await res.text()),
  },
};
const sent = [];
globalThis.fetch = async (url, init) => {
  sent.push({ url, method: init.method, body: init.body ? await new Response(init.body).text() : "" });
  return new Response('{"ok":true}', { status: 200, headers: { "content-type": "application/json" } });
};

// Limits count per clock window (15 minutes or an hour): pin the clock just after the hour
// so a run can't straddle two windows.
const pinnedNow = Math.floor(Date.now() / 3600000) * 3600000 + 60000;
Date.now = () => pinnedNow;

const { onRequest } = await import(new URL("../functions/api/[[path]].js", import.meta.url).href);
const { tooManyMessage } = await import(new URL("../cloudflare-lib/authlimit.js", import.meta.url).href);

const APP = "apps/6a8b5eb7787b8a4d6a18f662";
async function call(path, body, { ip = "1.1.1.1", method = "POST" } = {}) {
  const init = { method, headers: { "content-type": "application/json", "cf-connecting-ip": ip } };
  if (method !== "GET" && body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    // Browsers send the body's size; Node's Request doesn't add it by itself.
    init.headers["content-length"] = String(new TextEncoder().encode(init.body).length);
  }
  const request = new Request(`https://nebuluxai.com/api/${path}`, init);
  const before = sent.length;
  const res = await onRequest({ request, params: { path: path.split("/") } });
  return { status: res.status, res, forwarded: sent.length > before ? sent[sent.length - 1] : null };
}
async function times(n, fn) {
  let last;
  for (let i = 0; i < n; i++) last = await fn(i);
  return last;
}

// Password guessing on one account from one network.
const login = { email: "Maya@Example.com", password: "wrong-guess-1" };
let r = await times(10, () => call(`${APP}/auth/login`, login));
assert(r.status === 200 && r.forwarded, "10 sign-in tries go through");
assert(r.forwarded.body === JSON.stringify(login), "the sign-in body reaches Base44 unchanged");
assert(r.forwarded.url === `https://blackhole-ai.base44.app/api/${APP}/auth/login`, "to the real Base44 address");
r = await call(`${APP}/auth/login`, login);
assert(r.status === 429 && !r.forwarded, "the 11th try is refused before Base44");
const err = await r.res.json();
assert(/Too many tries/.test(err.message) && err.detail === err.message, "with a message the app shows (message/detail)");
assert(r.res.headers.get("retry-after") === String(15 * 60), "and a Retry-After");
r = await call(`${APP}/auth/login`, { ...login, email: " maya@example.com " });
assert(r.status === 429, "email case and spaces don't reset the count");
r = await call(`${APP}/auth/login`, { email: "someone@example.com", password: "x" });
assert(r.status === 200, "another account on the same network still signs in");
r = await call(`${APP}/auth/login`, login, { ip: "2.2.2.2" });
assert(r.status === 200, "the same account from another network still signs in");

// Guessing spread over many networks is capped per account.
cache.clear();
r = await times(50, (i) => call(`${APP}/auth/login`, login, { ip: `10.0.0.${i}` }));
assert(r.status === 200, "50 tries from different networks go through");
r = await call(`${APP}/auth/login`, login, { ip: "10.0.1.1" });
assert(r.status === 429, "the 51st on that account is refused, from any network");

// One network trying lots of accounts (a school network is shared, so the cap is high).
cache.clear();
r = await times(200, (i) => call(`${APP}/auth/login`, { email: `kid${i}@school.org`, password: "pw" }, { ip: "3.3.3.3" }));
assert(r.status === 200, "200 sign-ins from one network (a whole school) go through");
r = await call(`${APP}/auth/login`, { email: "kid999@school.org", password: "pw" }, { ip: "3.3.3.3" });
assert(r.status === 429, "the 201st from that network in 15 minutes is refused");

// Sign-up code guessing, and emails sent to someone over and over.
cache.clear();
r = await times(10, (i) => call(`${APP}/auth/verify-otp`, { email: "new@example.com", otp_code: String(100000 + i) }));
assert(r.status === 200, "10 sign-up code tries go through");
r = await call(`${APP}/auth/verify-otp`, { email: "new@example.com", otp_code: "123456" });
assert(r.status === 429, "the 11th code guess is refused");
r = await times(5, () => call(`${APP}/auth/resend-otp`, { email: "victim@example.com" }, { ip: "4.4.4.4" }));
assert(r.status === 200, "5 new codes an hour can be sent");
r = await call(`${APP}/auth/resend-otp`, { email: "victim@example.com" }, { ip: "5.5.5.5" });
assert(r.status === 429 && r.res.headers.get("retry-after") === "3600", "a 6th is refused, from any network");
r = await times(5, () => call(`${APP}/auth/reset-password-request`, { email: "victim@example.com" }));
assert(r.status === 200, "5 reset emails an hour can be sent");
r = await call(`${APP}/auth/reset-password-request`, { email: "victim@example.com" });
assert(r.status === 429, "a 6th reset email is refused");
assert(tooManyMessage(3600).includes("up to an hour") && tooManyMessage(900).includes("up to 15 minutes"), "the wait is in plain words");
r = await times(5, () => call(`${APP}/auth/register`, { email: "spam@example.com", password: "purple-giraffe-42" }));
assert(r.status === 200, "sign-up goes through");
r = await call(`${APP}/auth/register`, { email: "spam@example.com", password: "purple-giraffe-42" });
assert(r.status === 429, "the same email can't be signed up (and emailed a code) over and over");

// Everything else is untouched.
cache.clear();
r = await times(300, () => call(`${APP}/entities/PublishedSite`, { name: "x" }));
assert(r.status === 200 && r.forwarded.body === '{"name":"x"}', "other API calls aren't counted, and keep their body");
r = await times(20, () => call(`${APP}/auth/me`, undefined, { method: "GET" }));
assert(r.status === 200 && r.forwarded.method === "GET", "reading who's signed in isn't counted");
r = await times(20, () => call(`${APP}/auth/login`, "not json"));
assert(r.status === 200 && r.forwarded.body === "not json", "a body that isn't JSON passes through (Base44 answers it)");
cache.clear();
const huge = JSON.stringify({ email: "big@example.com", password: "x".repeat(20000) });
r = await times(12, () => call(`${APP}/auth/login`, huge));
assert(r.status === 200 && r.forwarded.body === huge, "an oversized body isn't read here, and still reaches Base44 whole");
cacheBroken = true;
r = await times(30, () => call(`${APP}/auth/login`, login));
assert(r.status === 200, "if counting fails, nobody is locked out");

// Only Base44's /api/ is reachable through the proxy.
cacheBroken = false;
{
  const up = await onRequest({ request: new Request("https://nebuluxai.com/api/x"), params: { path: ["..", "evil-page"] } });
  assert(up.status === 404 && sent.every((s) => !String(s.url).includes("evil-page")), "a path climbing out of /api/ is refused and nothing is fetched");
  const enc = await onRequest({ request: new Request("https://nebuluxai.com/api/x"), params: { path: ["%2e%2e", "evil-page"] } });
  assert(enc.status === 404, "also written as %2e%2e");
  for (const seg of ["..%2fsecret", "..%2F..%2Fsecret", "a%5c..%5csecret", "%E0%A4%A"]) {
    const r2 = await onRequest({ request: new Request("https://nebuluxai.com/api/x"), params: { path: ["apps", seg] } });
    assert(r2.status === 404, `a part like ${seg} is refused`);
  }
  const ok = await call(`${APP}/entities/PublishedSite`, undefined, { method: "GET" });
  assert(ok.status === 200 && ok.forwarded.url === `https://blackhole-ai.base44.app/api/${APP}/entities/PublishedSite`, "normal API calls still go to Base44's /api/");
  assert(ok.res.headers.get("x-content-type-options") === "nosniff", "answers can't be type-guessed by the browser");
}
