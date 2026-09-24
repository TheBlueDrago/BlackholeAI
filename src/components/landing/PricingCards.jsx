import React from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { PUBLIC_PLANS } from "@/lib/publicPlans";

// Free / Pro / Team / Enterprise cards for the public pages. Paid plans are bought from the
// app's Shop, so new people sign up first and land there; Enterprise goes to the
// application page.
export default function PricingCards() {
  const { isAuthenticated } = useAuth();
  const go = (id) =>
    id === "enterprise"
      ? "/enterprise"
      : id === "free"
      ? isAuthenticated ? "/chat" : "/register?returnTo=" + encodeURIComponent("/chat")
      : isAuthenticated ? "/chat/shop" : "/register?returnTo=" + encodeURIComponent("/chat/shop");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {PUBLIC_PLANS.map((p) => (
        <div
          key={p.id}
          className={`relative rounded-3xl p-6 flex flex-col ${
            p.highlight ? "bg-gradient-to-b from-indigo-500/20 to-fuchsia-500/10 border-2 border-indigo-400/60" : "bg-slate-900/60 border border-slate-700/50"
          }`}
        >
          {p.highlight && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold px-3 py-1 rounded-full bg-indigo-500 text-white">Most popular</span>
          )}
          <p className="text-lg font-semibold text-white">{p.name}</p>
          <p className="mt-2">
            <span className="text-4xl font-bold text-white">{p.price}</span>
            <span className="text-slate-400">{p.period}</span>
          </p>
          <p className="mt-2 text-sm text-slate-400">{p.blurb}</p>
          <ul className="mt-5 space-y-2.5 flex-1">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-200">
                <Check className="w-4 h-4 text-indigo-300 mt-0.5 shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <Link
            to={go(p.id)}
            className={`mt-6 py-3 rounded-full text-center font-semibold ${
              p.highlight ? "bg-white text-slate-900 hover:bg-slate-200" : "bg-slate-800 text-white hover:bg-slate-700"
            }`}
          >
            {p.id === "free" ? "Get started for free" : p.id === "enterprise" ? "Contact sales" : `Choose ${p.name}`}
          </Link>
        </div>
      ))}
    </div>
  );
}
