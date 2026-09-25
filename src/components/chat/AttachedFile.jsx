import React, { useEffect, useState } from "react";
import { Paperclip, X } from "lucide-react";

// One attached file above the message box: a small picture for images, else its name.
export default function AttachedFile({ file, onRemove }) {
  const isImage = /^image\//.test(file.type);
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!isImage) return undefined;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file, isImage]);

  return (
    <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700/50 rounded-lg pl-1 pr-2 py-1 text-xs text-slate-200">
      {url ? <img src={url} alt="" className="w-8 h-8 rounded object-cover" /> : <Paperclip className="w-3 h-3 ml-1 text-slate-400" />}
      <span className="max-w-[140px] truncate">{file.name}</span>
      <button type="button" onClick={onRemove} aria-label={`Remove ${file.name}`} className="text-slate-400 hover:text-red-400">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
