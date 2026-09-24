import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// For a pop-up (role="dialog"): while `open`, keyboard focus moves into it, Tab and Shift+Tab
// stay inside it, and when it closes focus goes back to whatever had it before (usually the
// button that opened it). Returns the ref to put on the dialog element.
export default function useDialogFocus(open) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const before = document.activeElement;
    const t = setTimeout(() => {
      const el = ref.current;
      if (el && !el.contains(document.activeElement)) {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      }
    }, 0);
    const onKey = (e) => {
      const el = ref.current;
      if (e.key !== "Tab" || !el) return;
      const items = [...el.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!el.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      if (before && typeof before.focus === "function" && document.contains(before)) before.focus({ preventScroll: true });
    };
  }, [open]);
  return ref;
}
