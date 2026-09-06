import React, { useState, useEffect } from "react";
import { Loader2, Gamepad2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BrowserGameFrame({ name, reloadKey }) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    base44.functions
      .invoke("get-game-html", { name })
      .then((res) => {
        const d = res.data;
        if (!d || d.error || !d.html) setNotFound(true);
        else setHtml(d.html);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (notFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
        <Gamepad2 className="w-10 h-10 mb-2" />
        <p>Game not found.</p>
      </div>
    );
  }
  return <iframe key={reloadKey} srcDoc={html} title={name} sandbox="allow-scripts" className="flex-1 w-full bg-black border-0" />;
}