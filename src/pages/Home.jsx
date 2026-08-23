import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import ChatBox from "@/components/ChatBox";
import CodePage from "@/components/CodePage";
import Sidebar from "@/components/Sidebar";
import Subscriptions from "@/components/Subscriptions";
import { useConversations } from "@/hooks/useConversations";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [mode, setMode] = useState("ai"); // "ai" | "code" | "subscriptions"
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const conv = useConversations();

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const goHome = () => setMode("ai");
  const goCode = () => setMode("code");
  const newChat = () => {
    conv.createConversation("New Chat");
    setMode("ai");
  };
  const codeSubmit = () => {
    conv.createConversation("New Chat");
    setMode("subscriptions");
  };
  const finishSubscriptions = () => setMode("ai");

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
        ) : mode === "subscriptions" ? (
          <Subscriptions key="subscriptions" onContinue={finishSubscriptions} />
        ) : (
          <motion.div
            key="chat"
            className="relative z-10 min-h-screen flex flex-col items-center justify-center py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.6, ease: "easeInOut" } }}
          >
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="fixed top-5 right-5 z-30 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50 text-slate-200 hover:bg-slate-700/70 transition-colors"
              title="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-start justify-center gap-5 w-full">
              {mode === "ai" ? (
                <ChatBox
                  conversation={conv.activeConversation}
                  createConversation={conv.createConversation}
                  addMessage={conv.addMessage}
                  renameConversation={conv.renameConversation}
                />
              ) : (
                <CodePage onSubmit={codeSubmit} />
              )}
              <AnimatePresence>
                {sidebarOpen && (
                  <Sidebar
                    conversations={conv.conversations}
                    activeId={conv.activeId}
                    onSelect={conv.selectConversation}
                    onRename={conv.renameConversation}
                    onGoHome={goHome}
                    onGoCode={goCode}
                    onNewChat={newChat}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}