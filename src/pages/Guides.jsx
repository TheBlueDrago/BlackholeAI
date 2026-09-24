import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { GUIDES } from "../../cloudflare-lib/guides.js";

// How-to guides: short, practical articles that answer what people search for ("how to make
// a website for free") and lead into the product. The words live in cloudflare-lib/guides.js.
export default function Guides() {
  return (
    <PublicLayout title="Guides">
      <section className="text-center pt-8 pb-10">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-indigo-300">
          <BookOpen className="w-4 h-4" /> Guides
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-bold text-white">Learn to make things with AI</h1>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">Short, step-by-step guides for websites, games and getting your work in front of people. No coding needed.</p>
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            to={`/guides/${g.slug}`}
            className="group flex flex-col rounded-2xl bg-slate-900/60 border border-slate-700/50 p-6 hover:border-indigo-500/50 transition-colors"
          >
            <h2 className="text-xl font-semibold text-white group-hover:text-indigo-200">{g.title}</h2>
            <p className="mt-2 text-slate-400 flex-1">{g.description}</p>
            <span className="mt-4 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <Clock className="w-4 h-4" /> {g.minutes} min read
              </span>
              <span className="inline-flex items-center gap-1 text-indigo-300 font-medium">
                Read <ArrowRight className="w-4 h-4" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </PublicLayout>
  );
}
