// blackhole-site-router — the Cloudflare Worker that serves every published site on
// its own subdomain (nova.blackhole-ai-tech.com). Bound to the route
// *.blackhole-ai-tech.com/* (wildcard DNS). This is a copy of the code deployed in the
// Cloudflare dashboard (Workers & Pages → blackhole-site-router), kept here so it's
// versioned and can be restored. Deploy changes with `npx wrangler deploy` from this
// folder (see wrangler.toml), or paste into the dashboard editor.
//
// It asks the app's get-site-html function for the page. That path on
// blackhole-ai-tech.com is the Cloudflare Pages function
// functions/api/apps/<appId>/functions/get-site-html.js (not Base44's), which applies
// admin take-downs and the phishing-form check to every site and adds the Buy Now
// checkout bridge, the Report link and link-preview tags. So this Worker doesn't need
// changing when those rules change. It adds PAGE_HEADERS below to every page it sends.

const APP_ID = "6a8b5eb7787b8a4d6a18f662";
const ROOT = "blackhole-ai-tech.com";
const API_BASE = "https://" + ROOT + "/api/apps/" + APP_ID + "/functions/";

// Sent with every page this Worker serves. Sites here are made by users (often young ones):
// they may not use the camera, microphone, USB devices or the browser's payment sheet (buying
// goes through the platform's checkout), browsers must not guess file types, and other
// websites aren't told which page someone came from.
const PAGE_HEADERS = {
  "Content-Type": "text/html;charset=UTF-8",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000",
  "Permissions-Policy": "camera=(), microphone=(), usb=(), payment=()",
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function notFoundPage(rawName) {
  var name = escapeHtml(rawName);
  return (
    "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Site not found</title><style>body{background:#05060f;color:#e2e8f0;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0}a{color:#818cf8}</style></head><body><h1>Site not found</h1><p>No published site named \"" +
    name +
    "\".</p><p><a href='https://" +
    ROOT +
    "'>Back to Blackhole AI</a></p></body></html>"
  );
}

export default {
  async fetch(request) {
    var url = new URL(request.url);
    var host = url.hostname;
    if (host === ROOT || host === "www." + ROOT) {
      return fetch(request);
    }
    if (host.indexOf("." + ROOT) !== host.length - ROOT.length - 1) {
      return new Response("Not found", { status: 404 });
    }
    var name = host.slice(0, host.length - ROOT.length - 1).toLowerCase();
    var apiRes;
    try {
      apiRes = await fetch(API_BASE + "get-site-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name }),
      });
    } catch (err) {
      return new Response(notFoundPage(name), { status: 502, headers: PAGE_HEADERS });
    }
    if (!apiRes.ok) {
      return new Response(notFoundPage(name), { status: 404, headers: PAGE_HEADERS });
    }
    var data = await apiRes.json();
    if (!data || !data.html) {
      return new Response(notFoundPage(name), { status: 404, headers: PAGE_HEADERS });
    }
    return new Response(data.html, { status: 200, headers: PAGE_HEADERS });
  },
};
