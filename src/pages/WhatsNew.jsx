import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ShieldCheck, Zap, BookOpen, Globe } from "lucide-react";
import PublicLayout, { START_FREE } from "@/components/PublicLayout";

// What changed lately, newest first, in plain words. Add to the top when something people
// would notice goes live; keep safety changes in Trust & safety's list too.
const UPDATES = [
  {
    date: "September 2026",
    items: [
      { icon: Sparkles, text: "The AI now remembers what you said earlier in the chat, so follow-ups like \"make it shorter\", \"why?\" or \"next question\" just work, in the chat and in Blackhole Code." },
      { icon: BookOpen, text: "Not sure what to ask? \"Things to ask AI\" has 36 ideas for school, writing, coding, everyday life, fun and work; tap one to try it." },
      { icon: Sparkles, text: "New here? A short welcome tour shows you around the chat, the menu, the Website and Game Designers and your profile, or you can explore on your own." },
      { icon: Sparkles, text: "In the chat: edit your last message and send it again, and have any answer read aloud with a tap of the speaker button." },
      { icon: Globe, text: "Forms on the websites you make now work: bookings, RSVPs and sign-ups arrive in your Messages inbox in the Website Designer, with a dot when something new comes in and a download to a spreadsheet." },
      { icon: BookOpen, text: "New guides for using the AI: homework help, writing, learning to code, resumes and cover letters, and running a small business, plus a guide for every website template." },
      { icon: Sparkles, text: "The chat suggests what to try first: homework help, explain simply, help me write and quiz me." },
      { icon: Sparkles, text: "Try any website template full screen before you sign up, and four new ones: local business, event invite, school club and resume." },
      { icon: Sparkles, text: "Edit your website's code by hand in the Website Designer, and push it to your own GitHub or download it as a ZIP on paid plans." },
      { icon: Zap, text: "The app opens much faster, especially when added to your phone's home screen, with no flash of the wrong colours." },
      { icon: ShieldCheck, text: "Every new account confirms its email with a code, fake accounts are limited, and sign-in always stays on blackhole-ai-tech.com." },
      { icon: ShieldCheck, text: "Buttons that ask \"Are you sure?\" now work in every browser, including the ones built into other apps." },
      { icon: Sparkles, text: "Lower prices for credit packs, and a new-member discount on them too." },
    ],
  },
];

export default function WhatsNew() {
  return (
    <PublicLayout title="What's new">
      <section className="text-center pt-8 pb-10">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-indigo-300">
          <Sparkles className="w-4 h-4" /> What's new
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-bold text-white">Always getting better</h1>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">
          New features and fixes, often straight from ideas people send us. Got one?{" "}
          <Link to="/contact?topic=idea" className="text-indigo-300 hover:text-indigo-200 underline">Tell us</Link>.
        </p>
      </section>
      <div className="max-w-2xl mx-auto space-y-10">
        {UPDATES.map((u) => (
          <section key={u.date}>
            <h2 className="text-xl font-bold text-white">{u.date}</h2>
            <ul className="mt-4 space-y-3">
              {u.items.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 rounded-2xl bg-slate-900/50 border border-slate-800 p-4">
                  <Icon className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
                  <span className="text-slate-300">{text}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-14 text-center">
        <Link to={START_FREE} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-semibold hover:opacity-90">
          Try it free
        </Link>
      </div>
    </PublicLayout>
  );
}
