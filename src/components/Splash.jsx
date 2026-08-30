import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Intro from "@/components/Intro";

export default function Splash() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(t);
  }, []);
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