import React, { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";

// Copies text and briefly shows a tick.
export function CopyButton({ getText, className = "", label = "Copy" }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      // Clipboard blocked (e.g. insecure context); nothing to do.
    }
  };
  return (
    <button type="button" onClick={copy} title={label} aria-label={label} className={`inline-flex items-center gap-1 ${className}`}>
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ children }) {
  const ref = useRef(null);
  return (
    <div className="relative group my-2">
      <pre ref={ref} className="bg-black/40 border border-slate-700/60 rounded-lg p-3 pr-9 overflow-x-auto text-[12.5px] leading-snug">
        {children}
      </pre>
      <CopyButton
        getText={() => ref.current?.innerText || ""}
        label="Copy code"
        className="absolute top-2 right-2 p-1 rounded-md bg-slate-800/90 text-slate-300 hover:text-white"
      />
    </div>
  );
}

const components = {
  pre: CodeBlock,
  code: ({ className, children }) =>
    className ? <code className={className}>{children}</code> : <code className="px-1 py-0.5 rounded bg-black/30 text-[0.92em]">{children}</code>,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="text-[12.5px] border-collapse [&_th]:border [&_td]:border [&_th]:border-slate-600 [&_td]:border-slate-700 [&_th]:px-2 [&_td]:px-2 [&_th]:py-1 [&_td]:py-1 [&_th]:bg-slate-700/40 [&_th]:text-left">
        {children}
      </table>
    </div>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-sky-300 hover:text-sky-200">
      {children}
    </a>
  ),
};

// AI replies rendered as Markdown (headings, lists, bold, code). Raw HTML in a reply
// is shown as text, never rendered (react-markdown's default).
export default function Markdown({ text }) {
  return (
    <div className="break-words [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:mt-3 [&_h2]:mt-3 [&_h3]:mt-2 [&_h1]:mb-1 [&_h2]:mb-1 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-600 [&_blockquote]:pl-3 [&_blockquote]:text-slate-300 [&_hr]:my-3 [&_hr]:border-slate-700">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{text || ""}</ReactMarkdown>
    </div>
  );
}
