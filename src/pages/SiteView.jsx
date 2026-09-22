import React, { useEffect } from "react";
import { useParams } from "react-router-dom";

// Published sites now have their own real subdomain (nova.blackhole-ai-tech.com,
// served by the blackhole-site-router Cloudflare Worker), so /site/:name just
// hands off to it instead of iframing the HTML in — the previous sandboxed
// srcDoc iframe (sandbox="allow-scripts", no allow-same-origin) silently broke
// anything using localStorage/sessionStorage, since that combination blocks
// storage access entirely. A real subdomain has its own genuine origin, so the
// site's own JS works exactly as it does standalone.
export default function SiteView() {
  const { name } = useParams();

  useEffect(() => {
    const n = (name || "").toLowerCase();
    window.location.replace(`https://${n}.blackhole-ai-tech.com`);
  }, [name]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
      Redirecting…
    </div>
  );
}
