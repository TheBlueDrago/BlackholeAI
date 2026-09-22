import React from "react";

// Published sites live at their own real subdomain (nova.blackhole-ai-tech.com,
// served by the blackhole-site-router Cloudflare Worker) rather than being
// fetched and embedded via srcDoc. A srcDoc iframe needs sandbox="allow-scripts"
// without allow-same-origin to stay safe, but that combination silently blocks
// localStorage/sessionStorage — a real subdomain is a genuinely different origin
// from blackhole-ai-tech.com, so allow-same-origin here only grants the site
// access to its own isolated storage, not the parent app's.
export default function BrowserSiteFrame({ name, title, reloadKey }) {
  const src = `https://${(name || "").toLowerCase()}.blackhole-ai-tech.com`;
  return (
    <iframe
      key={reloadKey}
      src={src}
      title={title}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      className="flex-1 w-full bg-white border-0"
    />
  );
}
