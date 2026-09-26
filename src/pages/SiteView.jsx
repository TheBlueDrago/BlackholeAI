import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { siteUrl } from "@/lib/blackholeDomain";

// Published sites now have their own real subdomain (nova.nebuluxai.com,
// served by the blackhole-site-router Cloudflare Worker), so /site/:name just
// hands off to it instead of iframing the HTML in — the previous sandboxed
// srcDoc iframe (sandbox="allow-scripts", no allow-same-origin) silently broke
// anything using localStorage/sessionStorage, since that combination blocks
// storage access entirely. A real subdomain has its own genuine origin, so the
// site's own JS works exactly as it does standalone.
export default function SiteView() {
  const { name } = useParams();
  // Only valid site names: otherwise a link like /site/evil.com%23 would send visitors from
  // our address to another website (an "open redirect" scammers use to make links look safe).
  const url = siteUrl(name);
  const ok = !!url;

  useEffect(() => {
    if (url) window.location.replace(url);
  }, [url]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
      {ok ? "Redirecting…" : "There's no site at that address."}
    </div>
  );
}
