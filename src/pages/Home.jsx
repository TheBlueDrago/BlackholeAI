import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatBox from "@/components/ChatBox";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            className="absolute inset-0 z-20 flex items-center justify-center px-6"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
          >
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="mb-6 flex justify-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                  <svg viewBox="0 0 24 24" className="w-11 h-11 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18.178 8c5.296 0 5.296 8 0 8-5.295 0-7.895-8-13.181-8-5.296 0-5.296 8 0 8 5.295 0 7.895-8 13.181-8z" />
                  </svg>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight"
              >
                <span className="bg-gradient-to-r from-white via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent">
                  Infinity AI
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="mt-6 text-slate-400 text-lg sm:text-xl font-light tracking-wide"
              >
                Endless possibilities, intelligently realized.
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            className="relative z-10 min-h-screen flex items-center justify-center py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.8, ease: "easeInOut" } }}
          >
            <ChatBox />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}