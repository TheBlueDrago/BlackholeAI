import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Play, X, Smartphone, Monitor } from "lucide-react";
import { withPreviewShim, PREVIEW_SANDBOX } from "@/lib/previewShim";
import useEscape from "@/hooks/useEscape";

// Web code the AI wrote in a chat (HTML, or an SVG picture) can be tried right there.
// It runs in the same locked-down frame as the designer's previews: its own blank origin,
// so it can't see the app, the person's sign-in or their saved chats.
export default function CodePreview({ getCode }) {
  const [html, setHtml] = useState("");
  const [phone, setPhone] = useState(false);
  useEscape(!!html, () => setHtml(""));
  return (
    <>
      <button
        type="button"
        onClick={() => setHtml(withPreviewShim(getCode()))}
        title="Preview: run this code"
        aria-label="Preview this code"
        className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md bg-slate-800/90 text-slate-300 hover:text-white text-[11px] font-medium"
      >
        <Play className="w-3.5 h-3.5" /> Preview
      </button>
      {html &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/70" onMouseDown={(e) => e.target === e.currentTarget && setHtml("")}>
            <div role="dialog" aria-modal="true" aria-label="Code preview" className="w-full max-w-5xl h-full max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
                <Play className="w-4 h-4 text-emerald-400" />
                <p className="text-sm font-semibold text-white">Preview</p>
                <p className="hidden sm:block text-xs text-slate-500">Runs safely, walled off from your account.</p>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPhone((p) => !p)}
                    title={phone ? "Computer size" : "Phone size"}
                    aria-label={phone ? "Show at computer size" : "Show at phone size"}
                    className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    {phone ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={() => setHtml("")} aria-label="Close preview" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 flex justify-center bg-slate-950">
                <iframe
                  title="Code preview"
                  srcDoc={html}
                  sandbox={PREVIEW_SANDBOX}
                  className={`h-full bg-white ${phone ? "w-[390px] max-w-full border-x border-slate-700" : "w-full"}`}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
