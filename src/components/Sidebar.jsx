import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pen, Plus, Code, Sparkles, Check, X, CreditCard } from "lucide-react";

const SKIP_KEY = "infinity-ai-skip-delete-confirm";

export default function Sidebar({ conversations, activeId, onSelect, onRename, onDelete, onGoHome, onGoCode, onNewChat, onGoSubscriptions }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [neverShow, setNeverShow] = useState(false);

  const startEdit = (conv) => {
    setEditingId(conv.id);
    setEditValue(conv.title);
  };

  const saveEdit = () => {
    if (editingId) onRename(editingId, editValue.trim() || "Untitled");
    setEditingId(null);
  };

  const askDelete = (e, conv) => {
    e.stopPropagation();
    if (localStorage.getItem(SKIP_KEY) === "1") {
      onDelete(conv.id);
      return;
    }
    setConfirmId(conv.id);
  };

  const confirmDelete = () => {
    if (neverShow) localStorage.setItem(SKIP_KEY, "1");
    onDelete(confirmId);
    setConfirmId(null);
    setNeverShow(false);
  };

  const cancelDelete = () => {
    setConfirmId(null);
    setNeverShow(false);
  };

  return (
    <>
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 264, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 28 }}
        className="shrink-0 h-[524px] overflow-hidden"
      >
        <motion.div
          initial={{ x: 90 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 28 }}
          className="w-[264px] h-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-4 space-y-1">
            <button
              onClick={onGoHome}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-white hover:bg-slate-800/70 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">AI</span>
            </button>
            <button
              onClick={onGoCode}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-slate-300 hover:bg-slate-800/70 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                <Code className="w-4 h-4 text-emerald-300" />
              </div>
              <span className="font-medium">AI Code</span>
            </button>
            <button
              onClick={onNewChat}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-slate-300 hover:bg-slate-800/70 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                <Plus className="w-4 h-4 text-slate-300" />
              </div>
              <span className="font-medium">New Chat</span>
            </button>
            <button
              onClick={onGoSubscriptions}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-slate-300 hover:bg-slate-800/70 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-amber-300" />
              </div>
              <span className="font-medium">Plans</span>
            </button>
          </div>

          {/* Previous chats label (non-clickable) */}
          <div className="px-4 pb-2">
            <div className="px-2 py-2 text-slate-500 text-sm font-medium cursor-default select-none">
              Previous Chats
            </div>
          </div>

          <div className="mx-4 h-px bg-slate-700/50" />

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 && (
              <p className="text-center text-slate-600 text-sm py-6">No chats yet</p>
            )}
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => editingId !== conv.id && onSelect(conv.id)}
                className={`group relative rounded-xl px-2 py-2 transition-colors cursor-pointer ${
                  conv.id === activeId ? "bg-slate-800/80" : "hover:bg-slate-800/40"
                }`}
              >
                {editingId === conv.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0 bg-slate-900 border border-indigo-500/50 rounded-lg px-2 py-1 text-sm text-white outline-none"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); saveEdit(); }}
                      className="p-1.5 rounded-lg bg-indigo-500 text-white shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-200 truncate pr-[60px]">{conv.title}</p>
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(conv); }}
                        className="p-1.5 rounded-md bg-slate-700/80 border border-slate-600/50 text-slate-300 hover:text-white"
                        title="Rename"
                      >
                        <Pen className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => askDelete(e, conv)}
                        className="p-1.5 rounded-md bg-slate-700/80 border border-slate-600/50 text-slate-300 hover:text-red-400"
                        title="Delete"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {confirmId && (
          <motion.div
            key="confirm-overlay"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white text-center">Are you sure you want to delete your chat?</h3>
              </div>
              <div className="flex gap-3 px-6">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
              <div className="h-px bg-slate-700/50 mx-6 mt-5" />
              <label className="flex items-center gap-2 px-6 py-4 cursor-pointer select-none text-slate-400 text-sm">
                <input
                  type="checkbox"
                  checked={neverShow}
                  onChange={(e) => setNeverShow(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500"
                />
                Never show this again
              </label>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}