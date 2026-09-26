import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QrCode, X, Download } from "lucide-react";
import useEscape from "@/hooks/useEscape";

// Button for the publish toast (and site cards): opens a QR code of the page's address, so
// people nearby can scan it with a phone camera and open the site or game straight away.
export function QrButton({ onClick, className = "bg-white/20 hover:bg-white/30" }) {
  return (
    <button type="button" onClick={onClick} title="QR code to open it on a phone" className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${className}`}>
      <QrCode className="w-3.5 h-3.5" /> QR
    </button>
  );
}

// The QR code itself. The qrcode library is fetched only when one is opened.
export default function QrDialog({ url, title, onClose }) {
  const [img, setImg] = useState("");
  const [err, setErr] = useState("");
  useEscape(!!url, onClose);
  useEffect(() => {
    if (!url) return undefined;
    let alive = true;
    setImg("");
    setErr("");
    import("qrcode")
      .then((QR) => QR.toDataURL(url, { width: 480, margin: 2, errorCorrectionLevel: "M", color: { dark: "#0f172a", light: "#ffffff" } }))
      .then((d) => alive && setImg(d))
      .catch(() => alive && setErr("Couldn't make the QR code. Share the link instead."));
    return () => {
      alive = false;
    };
  }, [url]);
  if (!url) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="QR code" className="relative w-full max-w-xs rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-center">
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
          <X className="w-4 h-4" />
        </button>
        <p className="text-base font-semibold text-white pr-6">{title || "Scan to open"}</p>
        <p className="mt-1 text-xs text-slate-400">Point a phone camera at it to open:</p>
        <div className="keep-color mt-3 mx-auto w-60 h-60 rounded-xl bg-white flex items-center justify-center overflow-hidden">
          {img ? <img src={img} alt={`QR code for ${url}`} className="w-full h-full" /> : <span className="text-xs text-slate-500">{err || "Making the QR code…"}</span>}
        </div>
        <p className="mt-2 text-[11px] text-slate-400 break-all">{url.replace(/^https:\/\//, "")}</p>
        {img && (
          <a href={img} download="qr-code.png" className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700">
            <Download className="w-3.5 h-3.5" /> Save picture
          </a>
        )}
      </div>
    </div>,
    document.body
  );
}
