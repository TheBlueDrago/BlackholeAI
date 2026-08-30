import React, { useRef, useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Wraps a scrollable container and adds touch pull-to-refresh.
// The ref'd element must be the actual scroll container (overflow-y-auto).
export default function PullToRefresh({ onRefresh, threshold = 70, max = 120, className = "", style, children }) {
  const elRef = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e) => {
    const el = elRef.current;
    if (el && el.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
      setPull(0);
    } else {
      pulling.current = false;
    }
  }, []);

  const onTouchMove = useCallback(
    (e) => {
      if (!pulling.current || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) setPull(Math.min(max, dy * 0.5));
    },
    [max, refreshing]
  );

  const onTouchEnd = useCallback(async () => {
    if (pull >= threshold && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
      }
    }
    pulling.current = false;
    setPull(0);
  }, [pull, threshold, refreshing, onRefresh]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  return (
    <div ref={elRef} style={style} className={className}>
      <div style={{ height: pull }} className="flex items-center justify-center overflow-hidden">
        <Loader2 className={`w-4 h-4 text-slate-400 ${refreshing ? "animate-spin" : ""}`} />
      </div>
      {children}
    </div>
  );
}