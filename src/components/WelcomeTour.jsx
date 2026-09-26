import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Compass, Gamepad2, Globe, MessageCircle, Menu, UserRound, X } from "lucide-react";
import BlackholeIcon from "@/components/BlackholeIcon";
import { shouldOfferTour, markTourSeen } from "@/lib/welcomeTour";

// A new account's first visit: offer a short guided tour, or let them explore on their own
// (who gets it: lib/welcomeTour.js). Each step can jump straight to the page.
// go: which app page "Try it" opens (see AppShellContext).
const STEPS = [
  {
    icon: MessageCircle,
    title: "Ask the AI anything",
    text: "Type or tap the microphone and ask in your own words: homework explained step by step, help writing an essay or email, a quiz before a test, or a photo of a question. Turn on Study mode and it guides you step by step, or ask for flashcards to study with.",
    cta: "Start chatting",
    go: "chat",
  },
  {
    icon: Menu,
    title: "Everything is in the menu",
    text: "The menu button in the top-left corner opens your chats and every tool: Nebulux Code for programming, the Website Designer and games.",
    cta: "Open the menu",
    go: "menu",
  },
  {
    icon: Globe,
    title: "Make a website",
    text: "Describe a website or pick a template, change anything by chatting, and publish it free at yourname.nebuluxai.com. Forms on it send messages straight to you.",
    cta: "Open the Website Designer",
    go: "designer",
  },
  {
    icon: Gamepad2,
    title: "Make a game",
    text: "Describe a game and play it right away, on a phone or a computer. When it's ready, share the link so friends can play too.",
    cta: "Open the Game Designer",
    go: "game",
  },
  {
    icon: UserRound,
    title: "Your credits and account",
    text: "Each AI reply uses credits, and you get a fresh allowance every month. Your profile (top right) has your plan, settings, safety tips and a way to reach us.",
    cta: "Open my profile",
    go: "profile",
  },
];

export default function WelcomeTour({ user, shell, blocked }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(-1); // -1: the choice; 0+: a tour step

  useEffect(() => {
    if (!blocked && shouldOfferTour(user)) setOpen(true);
  }, [user, blocked]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function finish() {
    markTourSeen(user.id);
    setOpen(false);
  }

  const tryIt = (go) => {
    finish();
    if (go === "chat") shell.goHome();
    else if (go === "menu") {
      shell.goHome();
      shell.setSidebarOpen(true);
    } else if (go === "designer") shell.goDesigner();
    else if (go === "game") shell.goGameDesigner();
    else if (go === "profile") shell.openProfile("main");
  };

  const s = step >= 0 ? STEPS[step] : null;
  const last = step === STEPS.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60">
      <div role="dialog" aria-modal="true" aria-labelledby="bh-tour-title" className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
        <button onClick={finish} aria-label="Close" className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        {!s ? (
          <div className="text-center">
            <div className="keep-color w-14 h-14 mx-auto rounded-2xl overflow-hidden flex items-center justify-center">
              <BlackholeIcon className="w-full h-full" />
            </div>
            <h2 id="bh-tour-title" className="mt-4 text-xl font-bold text-white">
              Welcome to Nebulux AI!
            </h2>
            <p className="mt-2 text-sm text-slate-400">Want a quick tour? It takes about a minute, and you can stop any time.</p>
            <div className="mt-6 space-y-2">
              <button
                onClick={() => setStep(0)}
                autoFocus
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-[#fff] font-semibold hover:opacity-90"
              >
                <Compass className="w-5 h-5" /> Let Nebulux AI guide me
              </button>
              <button onClick={finish} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-medium hover:bg-slate-700">
                I'll explore myself
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Step {step + 1} of {STEPS.length}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <s.icon className="w-6 h-6 text-indigo-200" />
              </span>
              <h2 id="bh-tour-title" className="text-lg font-bold text-white">
                {s.title}
              </h2>
            </div>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">{s.text}</p>
            <button onClick={() => tryIt(s.go)} className="mt-4 text-sm font-medium text-sky-300 hover:text-sky-200 underline underline-offset-2">
              {s.cta} now
            </button>
            <div className="mt-6 flex items-center justify-between gap-2">
              <button
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex gap-1" aria-hidden="true">
                {STEPS.map((_, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === step ? "bg-indigo-300" : "bg-slate-600"}`} />
                ))}
              </div>
              <button
                onClick={() => (last ? finish() : setStep(step + 1))}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-600 text-[#fff] text-sm font-semibold hover:bg-indigo-500"
              >
                {last ? "Finish" : "Next"} {!last && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
