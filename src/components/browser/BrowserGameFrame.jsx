import React, { useState, useEffect } from "react";
import { Loader2, Gamepad2 } from "lucide-react";
import { loadGame } from "@/lib/loadGame";
import { findBuiltInGame } from "@/lib/builtInGames";
import { withPreviewShim, PREVIEW_SANDBOX } from "@/lib/previewShim";

export default function BrowserGameFrame({ name, reloadKey }) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [removed, setRemoved] = useState("");

  useEffect(() => {
    const builtIn = findBuiltInGame(name);
    if (builtIn) {
      setHtml(builtIn.html);
      setLoading(false);
      setNotFound(false);
      setRemoved("");
      return;
    }
    setLoading(true);
    setNotFound(false);
    setRemoved("");
    loadGame(name)
      .then((g) => {
        if (!g) setNotFound(true);
        else if (g.removed) setRemoved(g.removed);
        else setHtml(g.html);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (removed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 px-6 text-center">
        <Gamepad2 className="w-10 h-10 mb-2" />
        <p>{removed}</p>
      </div>
    );
  }
  if (notFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
        <Gamepad2 className="w-10 h-10 mb-2" />
        <p>Game not found.</p>
      </div>
    );
  }
  return <iframe key={reloadKey} srcDoc={withPreviewShim(html)} title={name} sandbox={PREVIEW_SANDBOX} className="flex-1 w-full bg-black border-0" />;
}