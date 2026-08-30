import React from "react";
import { MessageSquare, Code2, LayoutPanelTop, Settings as SettingsIcon } from "lucide-react";

const TABS = [
  { key: "ai", label: "Chat", Icon: MessageSquare },
  { key: "code", label: "Code", Icon: Code2 },
  { key: "designer", label: "Designer", Icon: LayoutPanelTop },
];

export default function MobileTabBar({ active, onChat, onCode, onDesigner, onSettings, profileOpen }) {
  const go = (k) => {
    if (k === "ai") onChat();
    else if (k === "code") onCode();
    else if (k === "designer") onDesigner();
  };

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom border-t border-slate-700/50 bg-slate-900/90 backdrop-blur-xl">
      <div className="grid grid-cols-4">
        {TABS.map(({ key, label, Icon }) => {
          const on = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => go(key)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                on ? "text-indigo-400" : "text-slate-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onSettings}
          className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
            profileOpen ? "text-indigo-400" : "text-slate-400"
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          Settings
        </button>
      </div>
    </nav>
  );
}