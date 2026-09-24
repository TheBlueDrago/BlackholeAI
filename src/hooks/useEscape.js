import { useEffect, useRef } from "react";

// Calls onClose when Escape is pressed while `open` is true, so pop-ups can be closed from
// the keyboard as well as by clicking outside them.
export default function useEscape(open, onClose) {
  const latest = useRef(onClose);
  latest.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !e.defaultPrevented) latest.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
}
