import { useEffect, useRef } from "react";

// A preview started while its panel was hidden (0x0: a closed tab on a phone, a collapsed panel)
// gets a restart once the panel has a size. Many games size their canvas once when they load,
// so they'd otherwise stay 0x0: a black preview. Returns a ref for the panel.
export default function useRestartWhenShown(restart) {
  const ref = useRef(null);
  const wasEmpty = useRef(false);
  const restartRef = useRef(restart);
  restartRef.current = restart;
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const check = () => {
      const empty = el.clientWidth < 2 || el.clientHeight < 2;
      if (wasEmpty.current && !empty) restartRef.current();
      wasEmpty.current = empty;
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return ref;
}
