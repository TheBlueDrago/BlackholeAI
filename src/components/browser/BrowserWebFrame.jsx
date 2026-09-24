import React from "react";
import { ExternalLink, ShieldAlert } from "lucide-react";
import { safeWebUrl, notForKids } from "@/lib/blackholeDomain";

// What an outside page may do in the frame: run as its own site, show forms and open
// popups, but never navigate the app's tab away (that's how a page would swap the app for a
// fake sign-in page).
const WEB_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox";

// Loads a real external URL inside the browser chrome instead of leaving the tab.
// Many sites (banks, social networks, Google itself) refuse to render inside another
// page via X-Frame-Options/CSP — there's no way around that from here, so we always
// offer an escape hatch rather than pretending every site will embed.
export default function BrowserWebFrame({ url: raw, reloadKey }) {
  const url = safeWebUrl(raw);
  if (!url) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-300">
        <ShieldAlert className="w-8 h-8 text-amber-400" />
        <p className="font-medium">This address can't be opened.</p>
        <p className="text-sm text-slate-500">Only web addresses starting with http:// or https:// work here.</p>
      </div>
    );
  }
  if (notForKids(url)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-300">
        <ShieldAlert className="w-8 h-8 text-amber-400" />
        <p className="font-medium">This site isn't available in Blackhole Browser.</p>
        <p className="text-sm text-slate-500">Lots of kids use Blackhole AI, so adult, gambling and piracy sites are left out.</p>
      </div>
    );
  }
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
      <iframe key={reloadKey} src={url} title={url} sandbox={WEB_SANDBOX} referrerPolicy="no-referrer" className="flex-1 w-full border-0" />
    </div>
  );
}
