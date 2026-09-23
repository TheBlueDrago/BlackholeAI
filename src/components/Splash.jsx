import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Intro from "@/components/Intro";

const SEEN_KEY = "bh-splash-seen";
// Pages people open to get one thing done (often from a published site): no intro there.
const SKIP = /^\/(buy|report|site\/|terms|privacy|contact|ThankYou|promo-success)/;

// The intro plays once per tab, not again on every reload.
function shouldShow() {
  if (SKIP.test(window.location.pathname)) return false;
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return false;
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage blocked: show it, as before.
  }
  return true;
}

export default function Splash() {
  const [show, setShow] = useState(shouldShow);
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(t);
  }, [show]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100]"
        >
          <Intro />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
