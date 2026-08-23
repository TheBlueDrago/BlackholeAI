import React, { useState } from "react";
import { motion } from "framer-motion";
import { Pen, Plus, Code, Sparkles, Check } from "lucide-react";

export default function Sidebar({ conversations, activeId, onSelect, onRename, onNewChat }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (conv) => {
    setEditingId(conv.id);
    setEditValue(conv.title);
  };

  const saveEdit = () => {
    if (editingId) onRename(editingId, editValue.trim() || "Untitled");
    setEditingId(null);
  };

  return (
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
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl text-white">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">AI</span>
          </div>
          <button
            onClick={() => onNewChat("code")}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-slate-300 hover:bg-slate-800/70 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
              <Code className="w-4 h-4 text-indigo-300" />
            </div>
            <span className="font-medium">AI Code</span>
          </button>
        </div>

        {/* Previous chats header */}
        <div className="px-4 pb-2">
          <button
            onClick={() => onNewChat()}
            className="w-full flex items-center justify-between text-slate-400 text-sm font-medium px-2 py-2 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <span>Previous Chats</span>
            <Plus className="w-4 h-4" />
          </button>
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
                  <p className="text-sm text-slate-200 truncate pr-9">{conv.title}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(conv); }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-slate-700/80 border border-slate-600/50 text-slate-300 hover:text-white"
                    title="Rename"
                  >
                    <Pen className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}