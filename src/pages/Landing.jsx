import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Globe, Gamepad2, ArrowRight, Sparkles, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BlackholeIcon from "@/components/BlackholeIcon";
import SiteThumb from "@/components/SiteThumb";

const START = "/register?returnTo=" + encodeURIComponent("/chat");
const LOGIN = "/login?returnTo=" + encodeURIComponent("/chat");

const FEATURES = [
  { icon: MessageSquare, color: "text-indigo-300", title: "Chat with AI", text: "Ask questions, get homework help, brainstorm ideas or fix your code." },
  { icon: Globe, color: "text-sky-300", title: "Build a website", text: "Describe it in a sentence. Publish it at yourname.blackhole-ai-tech.com." },
  { icon: Gamepad2, color: "text-fuchsia-300", title: "Make a game", text: "Start from a playable game, change it by chatting, and share it with friends." },
];

// The games shipped with the app (src/lib/builtInGames.js), playable without an account.
// Listed by name only so their code isn't loaded with this page.
const GAMES = [
  { name: "pulse", title: "Pulse Jump", text: "Jump and fly through 7 neon levels.", color: "from-indigo-500 to-fuchsia-500" },
  { name: "veck", title: "Veck", text: "Fight waves of bots in a zero-gravity arena.", color: "from-fuchsia-500 to-rose-500" },
];

const STEPS = [
  ["Describe it", "Say what you want in your own words."],
  ["Change anything", "Ask for new colors, pages, levels or features."],
  ["Publish and share", "Get a link anyone can open."],
];

// "Made with Blackhole AI" badges link here with ?from=site:<name> or game:<name>.
function cameFrom() {
  const m = /^(site|game):([a-z0-9.-]{1,63})$/.exec(new URLSearchParams(window.location.search).get("from") || "");
  return m ? { kind: m[1], name: m[2] } : null;
}

// What signed-out visitors see first: what Blackhole AI does, real examples, and a way in.
export default function Landing() {
  const [from] = useState(cameFrom);
  const [sites, setSites] = useState([]);

  useEffect(() => {
    base44.functions
      .invoke("showcase", { action: "list" })
      .then((r) => setSites((r.data?.sites || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#000000] text-slate-100 overflow-hidden relative">
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />

      <header className="relative z-10 max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 py-5">
        <span className="flex items-center gap-2 font-bold tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
            <BlackholeIcon className="w-5 h-5" />
          </span>
          Blackhole AI
        </span>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/showcase" className="hidden sm:inline px-3 py-2 text-slate-300 hover:text-white">Gallery</Link>
          <Link to={LOGIN} className="px-3 py-2 text-slate-300 hover:text-white">Log in</Link>
          <Link to={START} className="px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-200">
            Start free
          </Link>
        </nav>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 pb-16">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center pt-10 pb-14 sm:pt-16 sm:pb-20"
        >
          {from && (
            <p className="inline-flex items-center gap-1.5 mb-6 px-3 py-1.5 rounded-full bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {from.kind === "game" ? "The game" : "The site"} &ldquo;{from.name}&rdquo; was made with Blackhole AI
            </p>
          )}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-[#ffffff] via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent">
              Make websites and games
              <br className="hidden sm:block" /> just by describing them
            </span>
          </h1>
          <p className="mt-5 text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            Chat with AI, build a website or make a game, then share it with a link. Free to start.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={START}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-90"
            >
              {from ? "Make your own" : "Start free"} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/showcase"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-200 font-medium hover:bg-slate-700/70"
            >
              See what people built
            </Link>
          </div>
        </motion.section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, color, title, text }) => (
            <div key={title} className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-5">
              <Icon className={`w-6 h-6 ${color}`} />
              <h2 className="mt-3 font-semibold text-white">{title}</h2>
              <p className="mt-1 text-sm text-slate-400">{text}</p>
            </div>
          ))}
        </section>

        <section className="mt-14 sm:mt-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Play one now</h2>
          <p className="mt-1 text-slate-400 text-sm">Games made with Blackhole AI. No account needed.</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GAMES.map((g) => (
              <Link
                key={g.name}
                to={`/play/${g.name}`}
                className="group flex items-center gap-4 rounded-2xl bg-slate-900/60 border border-slate-700/50 p-4 hover:border-fuchsia-500/50 transition-colors"
              >
                <span className={`shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center`}>
                  <Gamepad2 className="w-7 h-7 text-white" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-white">{g.title}</span>
                  <span className="block text-sm text-slate-400">{g.text}</span>
                </span>
                <Play className="w-5 h-5 text-slate-500 group-hover:text-white shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 sm:mt-20">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-white">How it works</h2>
          <ol className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="flex gap-3 rounded-2xl bg-slate-900/40 border border-slate-800 p-5">
                <span className="shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-sm font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold text-white">{title}</span>
                  <span className="block text-sm text-slate-400 mt-0.5">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {sites.length > 0 && (
          <section className="mt-14 sm:mt-20">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Made by people like you</h2>
              <Link to="/showcase" className="shrink-0 text-sm text-indigo-300 hover:text-indigo-200">See all</Link>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {sites.map((s) => (
                <a
                  key={s.name}
                  href={`https://${s.name}.blackhole-ai-tech.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-3 hover:border-indigo-500/50 transition-colors"
                >
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-800">
                    <SiteThumb name={s.name} />
                  </div>
                  <p className="mt-3 px-1 text-sm font-medium text-white truncate">{s.title || s.name}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 sm:mt-20 text-center rounded-3xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 border border-indigo-400/20 px-6 py-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Your first site takes a few minutes</h2>
          <p className="mt-2 text-slate-400">Free to start. Pro is $1 a month if you want more.</p>
          <Link
            to={START}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-200"
          >
            Start free <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <footer className="relative z-10 text-center text-xs text-slate-500 pb-8 space-x-3">
        <Link to="/showcase" className="hover:underline">Gallery</Link>
        <Link to="/terms" className="hover:underline">Terms</Link>
        <Link to="/privacy" className="hover:underline">Privacy</Link>
        <Link to="/contact" className="hover:underline">Contact</Link>
      </footer>
    </div>
  );
}
