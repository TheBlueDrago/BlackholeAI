import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Shows once when a user first becomes a Team owner with no members yet, prompting them
// to add their 2 people now or later (Account → Settings → Membership).
export default function TeamWelcomePopup({ onAddPeople }) {
  const [show, setShow] = useState(false);
  const [ownerPlan, setOwnerPlan] = useState("team");

  useEffect(() => {
    base44.functions
      .invoke("my-team")
      .then((r) => {
        const t = r.data?.team;
        if (t && t.isOwner && t.active && t.id && (t.memberEmails ?? []).length === 0) {
          const key = "infinity-team-welcome-" + t.id;
          if (localStorage.getItem(key) !== "1") {
            setOwnerPlan(t.ownerPlan ?? "team");
            setShow(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    base44.functions
      .invoke("my-team")
      .then((r) => {
        const t = r.data?.team;
        if (t?.id) localStorage.setItem("infinity-team-welcome-" + t.id, "1");
      })
      .catch(() => {});
    setShow(false);
  };

  const addNow = () => {
    dismiss();
    onAddPeople?.();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-900 border border-sky-500/40 rounded-2xl p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-sky-300" />
            </div>
            <h3 className="text-lg font-semibold text-white">Redeem your membership</h3>
            <p className="text-slate-400 text-sm mt-2">
              {ownerPlan === "enterprise"
                ? "Add the people in your organization now, or later from your account → Settings → Membership."
                : `Add up to ${ownerPlan === "secret" ? 4 : 2} people to your ${ownerPlan === "secret" ? "Secret" : "Team"} now, or add them later from your account → Settings → Membership.`}
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={dismiss}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-medium hover:bg-slate-700"
              >
                Later
              </button>
              <button
                onClick={addNow}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white font-medium hover:opacity-90 inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add people
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}