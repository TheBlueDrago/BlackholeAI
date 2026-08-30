import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Gamepad2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function GameView() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = false;
    (async () => {
      try {
        const list = await base44.entities.PublishedGame.filter({ name });
        const g = list && list[0];
        if (!g) {
          setGame(null);
          setLoading(false);
          return;
        }
        setGame(g);
        // increment plays (client SDK bypasses RLS)
        try {
          await base44.entities.PublishedGame.update(g.id, { plays: (g.plays || 0) + 1 });
        } catch {}
      } catch {
      } finally {
        if (!done) setLoading(false);
        done = true;
      }
    })();
  }, [name]);

  return (
    <div className="h-screen flex flex-col bg-[#0b0f1a]">
      <header className="h-12 shrink-0 flex items-center gap-3 px-4 border-b border-white/10">
        <button
          onClick={() => navigate("/chat/games")}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5 text-slate-200" />
        </button>
        <span className="font-semibold text-slate-100 truncate">{game?.title || game?.name || name}</span>
        {game?.genre && <span className="text-xs text-slate-400 capitalize">· {game.genre}</span>}
      </header>
      <div className="flex-1 relative bg-black">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : game ? (
          <iframe srcDoc={game.html} title={game.name} sandbox="allow-scripts" className="w-full h-full" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Gamepad2 className="w-10 h-10 mb-2" />
            <p>Game not found.</p>
          </div>
        )}
      </div>
    </div>
  );
}