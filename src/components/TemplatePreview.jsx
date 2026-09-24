import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Monitor, Smartphone, X } from "lucide-react";
import { PREVIEW_SANDBOX, withPreviewShim } from "@/lib/previewShim";

// Full-screen, working preview of a starter template (forms, countdowns and section links
// all run), so visitors can try one before signing up. Same sandbox as the designer
// preview: scripts run, but the page can't reach the app or anyone's account.
export default function TemplatePreview({ template, onClose, onUse }) {
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const sizeBtn = (on) => `p-2 rounded-lg transition-colors ${on ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`;

  // Portal to <body>: the public pages' <main> is its own stacking layer, under the header.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`${template.title} preview`} className="fixed inset-0 z-[60] flex flex-col bg-slate-950">
      <div className="flex items-center gap-2 px-3 sm:px-5 py-2.5 border-b border-slate-800">
        <button onClick={onClose} aria-label="Close preview" className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold truncate">{template.title}</p>
          <p className="text-xs text-slate-400 truncate">{template.blurb} · try the buttons and forms</p>
        </div>
        <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button onClick={() => setPhone(false)} className={sizeBtn(!phone)} aria-label="Computer size" aria-pressed={!phone} title="Computer">
            <Monitor className="w-4 h-4" />
          </button>
          <button onClick={() => setPhone(true)} className={sizeBtn(phone)} aria-label="Phone size" aria-pressed={phone} title="Phone">
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => onUse(template)}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white text-sm font-semibold hover:opacity-90"
        >
          <span className="hidden sm:inline">Use this template</span>
          <span className="sm:hidden">Use it</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className={`flex-1 min-h-0 flex justify-center ${phone ? "sm:py-6 bg-slate-900" : ""}`}>
        <iframe
          key={template.id}
          srcDoc={withPreviewShim(template.html)}
          title={template.title}
          sandbox={PREVIEW_SANDBOX}
          className={`h-full bg-white border-0 ${phone ? "w-full sm:w-[390px] sm:rounded-[28px] sm:border-[10px] sm:border-slate-800 sm:shadow-2xl" : "w-full"}`}
        />
      </div>
    </div>,
    document.body
  );
}
