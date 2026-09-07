import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Renders a published website. HTML is fetched server-side so large sites stored as files work.
export default function BrowserSiteFrame({ name, title, reloadKey }) {
  const [html, setHtml] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setHtml("");
    setErr("");
    base44.functions
      .invoke("get-site-html", { name })
      .then((r) => setHtml(r.data?.html || ""))
      .catch((e) => setErr(e?.response?.data?.error || e?.message || "Could not load this site."));
  }, [name, reloadKey]);

  if (err) return <div className="flex-1 flex items-center justify-center text-red-400 text-sm">{err}</div>;
  if (!html) return <div className="flex-1 flex items-center justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return <iframe srcDoc={html} title={title} sandbox="allow-scripts" className="flex-1 w-full bg-white border-0" />;
}