import { useEffect, useRef } from "react";

// Keeps a chat's message list at the newest message while new text arrives, but only when the
// reader is already at (or near) the bottom. Jumping down on every streamed word used to drag
// people back while they scrolled up to read, which on phones felt like the chat wouldn't scroll.
// `deps` change when content changes. When `jumpKey` changes (the reader sent a message, or
// opened another conversation) it jumps down regardless.
export default function useStickToBottom(ref, deps, jumpKey) {
  const atBottom = useRef(true);
  const lastKey = useRef(jumpKey);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    const jump = lastKey.current !== jumpKey;
    lastKey.current = jumpKey;
    if (!el || !(atBottom.current || jump)) return;
    el.scrollTop = el.scrollHeight;
    atBottom.current = true;
  }, [...deps, jumpKey]);
}
