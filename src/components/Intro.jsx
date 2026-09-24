import React from "react";
import BlackholeIcon from "@/components/BlackholeIcon";

// The opening splash. Animated with CSS (bh-rise / bh-fade-in in index.css) rather than
// framer-motion, which keeps that library out of the first download every visitor makes.
export default function Intro() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#000000] overflow-hidden relative flex items-center justify-center px-6">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="text-center relative z-10">
        <div className="bh-rise mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <BlackholeIcon className="w-12 h-12" />
          </div>
        </div>

        <h1 className="bh-rise text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight" style={{ animationDelay: "0.2s" }}>
          <span className="bg-gradient-to-r from-[#ffffff] via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent">Blackhole AI</span>
        </h1>

        <p className="bh-fade-in mt-6 text-slate-400 text-lg sm:text-xl font-light tracking-wide" style={{ animationDelay: "0.5s" }}>
          Endless possibilities, intelligently realized.
        </p>
      </div>
    </div>
  );
}
