import React from "react";
import { Link } from "react-router-dom";
import { Store, Wand2, Globe, Users, Download, ShieldCheck, ArrowRight, Handshake, MessageCircle, Inbox } from "lucide-react";
import PublicLayout, { START_FREE } from "@/components/PublicLayout";
import PricingCards from "@/components/landing/PricingCards";

const POINTS = [
  { icon: Wand2, title: "Describe it, get a website", text: "Say what your business does. The AI writes the pages, the words and the design, and changes anything you ask." },
  { icon: MessageCircle, title: "An AI for the daily work", text: "Draft emails and replies to customers, write product descriptions and social posts, and plan your week, in the same app." },
  { icon: Globe, title: "Online in minutes", text: "Publish free at yourbusiness.nebuluxai.com and share the link anywhere." },
  { icon: Inbox, title: "Bookings reach you", text: "Booking, contact and sign-up forms on your site send what customers type straight to your Messages inbox." },
  { icon: Store, title: "Sell from your site", text: "Add Buy buttons for your products. Payments are being upgraded right now; ask us for early access." },
  { icon: Users, title: "Work as a team", text: "The Team plan lets up to 3 people build together and share one pool of AI credits." },
  { icon: Download, title: "Your code is yours", text: "On Pro and Team, download your site as a ZIP or push it to GitHub whenever you like." },
  { icon: ShieldCheck, title: "Safe by design", text: "Every published page is checked for scams and harmful content, and visitors can report a page." },
];

// For shops, clubs and small businesses, plus a door for partners, investors and buyers.
export default function Business() {
  return (
    <PublicLayout title="Websites for your business">
      <section className="text-center pt-8 pb-12">
        <h1 className="text-3xl sm:text-5xl font-bold text-white">A website for your business, today</h1>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">
          For shops, cafés, clubs, freelancers and side projects. No designer, no code: describe it and Nebulux AI builds it.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={START_FREE} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold hover:opacity-90">
            Build my site free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/contact?topic=business" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-200 font-medium hover:bg-slate-700/70">
            Talk to us
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {POINTS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-5">
            <Icon className="w-6 h-6 text-indigo-300" />
            <h2 className="mt-3 font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-400">{text}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-white">Simple prices</h2>
        <div className="mt-8">
          <PricingCards />
        </div>
        <p className="text-center mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link to="/templates" className="text-sm text-indigo-300 hover:text-indigo-200">Start from a free template →</Link>
          <Link to="/enterprise" className="text-sm text-violet-300 hover:text-violet-200">Enterprise for registered businesses →</Link>
        </p>
      </section>

      <section className="mt-14 rounded-3xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 border border-indigo-400/20 px-6 py-10 flex flex-col sm:flex-row items-center gap-6">
        <Handshake className="w-12 h-12 text-indigo-200 shrink-0" />
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Partners, investors and acquirers</h2>
          <p className="mt-1 text-slate-400">
            Interested in partnering with Nebulux AI, investing, or acquiring it? We'd like to hear from you.
          </p>
        </div>
        <Link to="/contact?topic=partnership" className="shrink-0 px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-200">
          Get in touch
        </Link>
      </section>
    </PublicLayout>
  );
}
