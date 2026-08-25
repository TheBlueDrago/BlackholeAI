import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, User } from "lucide-react";
import ChatBox from "@/components/ChatBox";
import CodePage from "@/components/CodePage";
import Sidebar from "@/components/Sidebar";
import Subscriptions from "@/components/Subscriptions";
import Profile from "@/components/Profile";
import { useConversations } from "@/hooks/useConversations";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate } from "react-router-dom";

export default function Chat() {
  const [mode, setMode] = useState("ai"); // "ai" | "code" | "subscriptions"
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const conv = useConversations();
  const navigate = useNavigate();
  const credits = useCredits();

  // Record this account's email so re-registration after deletion can be blocked.
  useEffect(() => {
    base44.functions.invoke("record-email").catch(() => {});
  }, []);

  const goHome = () => setMode("ai");
  const goCode = () => setMode("code");
  const newChat = () => {
    conv.createConversation("New Chat");
    setMode("ai");
  };
  const goSubscriptions = () => setMode("subscriptions");
  const finishSubscriptions = () => setMode("ai");
  const goBilling = (productId = "pro") => navigate("/billing", { state: { productId } });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />

      {mode === "subscriptions" ? (
        <Subscriptions onFree={finishSubscriptions} onPro={() => goBilling("pro")} onTeam={() => goBilling("team")} />
      ) : (
        <motion.div
          className="relative z-10 min-h-screen flex flex-col items-center justify-center py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="fixed top-5 left-5 z-30 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50 text-slate-200 hover:bg-slate-700/70 transition-colors"
            title="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <button
            onClick={() => setProfileOpen(true)}
            className="fixed top-5 right-5 z-30 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50 text-slate-200 hover:bg-slate-700/70 transition-colors"
            title="Profile"
          >
            <User className="w-6 h-6" />
          </button>

          <div className="flex items-center justify-center gap-5 w-full min-h-[524px]">
            <AnimatePresence>
              {sidebarOpen && (
                <Sidebar
                  conversations={conv.conversations}
                  activeId={conv.activeId}
                  onSelect={conv.selectConversation}
                  onRename={conv.renameConversation}
                  onDelete={conv.deleteConversation}
                  onGoHome={goHome}
                  onGoCode={goCode}
                  onNewChat={newChat}
                  onGoSubscriptions={goSubscriptions}
                  credits={{ aiTotal: credits.aiTotal, aiUsed: credits.aiUsed, aiCodeTotal: credits.aiCodeTotal, aiCodeUsed: credits.aiCodeUsed }}
                />
              )}
            </AnimatePresence>
            {mode === "ai" ? (
              <ChatBox
                conversation={conv.activeConversation}
                createConversation={conv.createConversation}
                addMessage={conv.addMessage}
                renameConversation={conv.renameConversation}
                aiExhausted={credits.aiExhausted}
                onSpendAI={credits.spendAI}
              />
            ) : (
              <CodePage aiCodeExhausted={credits.aiCodeExhausted} onSpendAICode={credits.spendAICode} />
            )}
          </div>

          <Profile open={profileOpen} onClose={() => setProfileOpen(false)} />
        </motion.div>
      )}
    </div>
  );
}