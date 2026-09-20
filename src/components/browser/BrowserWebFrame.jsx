import React from "react";
import { ExternalLink } from "lucide-react";

// Loads a real external URL inside the browser chrome instead of leaving the tab.
// Many sites (banks, social networks, Google itself) refuse to render inside another
// page via X-Frame-Options/CSP — there's no way around that from here, so we always
// offer an escape hatch rather than pretending every site will embed.
export default function BrowserWebFrame({ url, reloadKey }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div className="shrink-0 flex items-center justify-between gap-3 px-3 sm:px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs">
        <span className="truncate">Some sites don't allow being shown inside another page.</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 shrink-0 font-medium hover:underline"
        >
          Open in new tab <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <iframe key={reloadKey} src={url} title={url} className="flex-1 w-full border-0" />
    </div>
  );
}
