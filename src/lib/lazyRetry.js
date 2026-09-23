import { lazy } from "react";

// Pages load on demand in separate files whose names change with every deploy. Anyone
// who had the app open during a deploy asks for the OLD file names, which no longer
// exist, and the page failed to load (the whole app went blank). When that happens,
// reload once to pick up the new version; if it still fails, let the error show.
const KEY = "blackhole-chunk-reload";

export function lazyRetry(factory) {
  return lazy(async () => {
    try {
      const mod = await factory();
      try {
        sessionStorage.removeItem(KEY);
      } catch {}
      return mod;
    } catch (err) {
      let reloaded = false;
      try {
        reloaded = sessionStorage.getItem(KEY) === "1";
        if (!reloaded) sessionStorage.setItem(KEY, "1");
      } catch {}
      if (!reloaded) {
        window.location.reload();
        // Keep React waiting while the page reloads.
        return new Promise(() => {});
      }
      throw err;
    }
  });
}
