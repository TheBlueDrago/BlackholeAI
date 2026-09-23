// Scripts (and link-preview meta tags) that cloudflare-lib/pageserve.js adds to published
// pages carry a data-bh attribute. The designer's "edit" loads the served page, so they
// would otherwise be saved into the site on republish and added again on every serve.
// No imports, so both published.js and the serving function can use it.

const MARKED = /<script data-bh(?:="[^"]*")?>[\s\S]*?<\/script>|<meta data-bh\b[^>]*>/g;
// The checkout bridge as it was served before it was marked.
const LEGACY_BRIDGE = /<script>\(function\(\)\{if\(window\.top!==window\)return;window\.addEventListener\("message",function\(e\)\{var d=e\.data;if\(e\.source!==window\|\|!d\|\|d\.type!=="blackhole-checkout"\)return;[\s\S]*?<\/script>/g;

export function stripInjected(html) {
  return String(html || "").replace(MARKED, "").replace(LEGACY_BRIDGE, "");
}
