import { useEffect, useRef, useState } from "react";

// Plain words from a reply's markdown, for reading aloud: code blocks become "(code)".
export function spokenReply(md, max = 300) {
  const t = String(md || "")
    .replace(/```[\s\S]*?(```|$)/g, " (code) ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>`~|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
}

// Screen readers hear each new reply once it's finished (read from a hidden live region),
// but not the whole chat again when another conversation is opened.
export default function useReplyAnnouncer(messages, loading, conversationKey) {
  const [text, setText] = useState("");
  const seen = useRef({ key: conversationKey, count: messages.length });
  useEffect(() => {
    const s = seen.current;
    if (s.key !== conversationKey) {
      seen.current = { key: conversationKey, count: messages.length };
      setText("");
      return;
    }
    const last = messages[messages.length - 1];
    if (!loading && messages.length > s.count && last && last.role === "ai") setText(`Blackhole AI replied: ${spokenReply(last.content)}`);
    s.count = messages.length;
  }, [messages, loading, conversationKey]);
  return text;
}
