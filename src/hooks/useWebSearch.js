import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Fetches the Blackhole AI answer + web-style links for a search query.
export function useWebSearch(query, enabled) {
  const [state, setState] = useState({ loading: false, answer: "", answerLabel: "", results: [] });

  useEffect(() => {
    if (!enabled || !query) {
      setState({ loading: false, answer: "", answerLabel: "", results: [] });
      return;
    }
    let cancelled = false;
    setState({ loading: true, answer: "", answerLabel: "", results: [] });
    base44.functions
      .invoke("browserSearch", { query })
      .then((res) => {
        if (cancelled) return;
        const d = res.data || {};
        setState({ loading: false, answer: d.answer || "", answerLabel: d.answerLabel || "", results: d.results || [] });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, answer: "", answerLabel: "", results: [] });
      });
    return () => { cancelled = true; };
  }, [query, enabled]);

  return state;
}