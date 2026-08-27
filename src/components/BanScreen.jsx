import React from "react";
import { ShieldX, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BanScreen({ banned, until }) {
  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-700/60 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto mb-5">
          <ShieldX className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          {banned ? "You are banned" : "You are temporarily blocked"}
        </h1>
        <p className="text-slate-400 mt-3 text-sm leading-relaxed">
          {banned
            ? "Your account has been permanently banned by an administrator."
            : `Your access is restricted until ${until ? new Date(until).toLocaleString() : "later"}.`}
        </p>
        <button
          onClick={() => base44.auth.logout()}
          className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 font-medium hover:bg-slate-700 transition-colors"
        >
          <span className="inline-flex items-center gap-2 justify-center">
            <LogOut className="w-4 h-4" /> Log out
          </span>
        </button>
      </div>
    </div>
  );
}