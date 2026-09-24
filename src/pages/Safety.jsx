import React from "react";
import { Link } from "react-router-dom";
import { CreditCard, Lock, ShieldCheck, Flag, Baby, KeyRound, Mail, ArrowRight, Check, Store } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { CONTACT_EMAIL } from "@/lib/company";

// Trust & safety: how payments, accounts and published pages are protected, in plain words.
// Everything here describes what the app really does; keep it in step with the code
// (payments: base44/functions/create-checkout and payments-webhook; credits:
// cloudflare-lib/credits.js; publishing checks: cloudflare-lib/published.js, scan.js,
// phishing.js; page isolation: cloudflare-lib/pageserve.js and src/lib/previewShim.js).
const SECTIONS = [
  {
    icon: CreditCard,
    title: "Paying is safe",
    points: [
      "Checkout is run by Base44 Payments on its own secure page. We never see or store your card number.",
      "Prices are worked out on our server, not in your browser, so nobody can change what something costs.",
      "A payment only counts once the payment provider's signed message confirms it.",
      "Plans are monthly. If you stop paying you go back to the Free plan and keep your account. Credit packs are one-time, with no subscription.",
    ],
  },
  {
    icon: Lock,
    title: "Your account and credits",
    points: [
      "Your credits and plan are counted on our server, so they can't be changed or reset from a browser.",
      "New passwords that are easy to guess, like the ones on attackers' lists, can't be used.",
      "After too many wrong passwords or sign-up codes, signing in to that account pauses for a few minutes, so nobody can keep guessing.",
      "Admin tools, like giving someone a plan or credits, only work for our team, and that's checked on the server every time.",
      "You can delete your account, and every site and game in it, whenever you like (Settings → Delete account).",
      "Your email address is never shown on your published sites or in the gallery.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Published sites and games are walled off",
    points: [
      "Every published site lives at its own web address, so it can't read your Blackhole AI account.",
      "Previews in the app run in a locked-down frame that can't reach your account either.",
      "Pages with a form that sends passwords or card numbers to another website are refused when they're published, and when they're served.",
      "Buy buttons on sites people make always go through the same secure checkout. Sites can't collect card numbers themselves.",
    ],
  },
  {
    icon: Store,
    title: "Buying and selling on sites people make",
    points: [
      "Buy buttons on a site always open the same secure checkout, where you see the seller's site, the price and any tax before you pay.",
      "Only a site's real owner can set its prices and be paid for its sales.",
      "Sellers are paid after a waiting period, so card disputes can come in first, and a sale that looks like fraud is held while we check it.",
      "The seller is responsible for delivering what they sell and for refunds. If something's wrong, report the site.",
    ],
  },
  {
    icon: Baby,
    title: "Safe for young makers",
    points: [
      "Our AI is set up on our server to keep what it writes suitable for kids, and it won't build scam or password-stealing pages.",
      "Pages are checked for adult content, scams, hidden code and other harmful things before they go live.",
      "The Blackhole Browser is family-friendly: adult, gambling and piracy sites are left out of search and can't be opened in it.",
      "Every published page has a Report link, and reports are reviewed by a person.",
      "Pages that break the rules are taken down, and their owner can't put them back up.",
    ],
  },
];

const TIPS = [
  "We will never ask for your password, by email, phone or chat.",
  "Only type your password on blackhole-ai-tech.com. Check the address first.",
  "Use a password you don't use anywhere else.",
  "If a site made with Blackhole AI asks for a password or card number, don't enter it, and report it.",
];

export default function Safety() {
  return (
    <PublicLayout title="Trust & safety">
      <section className="pt-10 sm:pt-16 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">Trust & safety</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold text-white leading-tight">How we keep you, your money and your work safe</h1>
        <p className="mt-5 text-slate-400 text-lg">
          Lots of people who use Blackhole AI are students and first-time makers. Here, in plain words, is what protects your account, your payments and the
          things you publish.
        </p>
      </section>

      <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
        {SECTIONS.map(({ icon: Icon, title, points }) => (
          <div key={title} className="rounded-3xl bg-slate-900/50 border border-slate-800 p-6">
            <Icon className="w-7 h-7 text-emerald-300" />
            <h2 className="mt-3 text-xl font-semibold text-white">{title}</h2>
            <ul className="mt-3 space-y-2.5">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-slate-300 text-sm">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-3xl bg-amber-500/10 border border-amber-400/30 p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-amber-300" />
          <h2 className="text-xl font-semibold text-white">Staying safe yourself</h2>
        </div>
        <ul className="mt-4 grid sm:grid-cols-2 gap-3">
          {TIPS.map((t) => (
            <li key={t} className="flex items-start gap-2 text-slate-200 text-sm">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid md:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-slate-900/50 border border-slate-800 p-6">
          <Flag className="w-7 h-7 text-rose-300" />
          <h2 className="mt-3 text-xl font-semibold text-white">Seen something wrong?</h2>
          <p className="mt-2 text-slate-400 text-sm">Report a site or game that looks like a scam, bullies someone, copies someone else, or isn't OK for kids.</p>
          <Link to="/report" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-rose-200">
            Report a page <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="rounded-3xl bg-slate-900/50 border border-slate-800 p-6">
          <Mail className="w-7 h-7 text-indigo-300" />
          <h2 className="mt-3 text-xl font-semibold text-white">Found a security problem?</h2>
          <p className="mt-2 text-slate-400 text-sm">
            If you think you've found a way to get into accounts, credits or payments, please tell us privately first so we can fix it. We read every message.
          </p>
          <Link to="/contact?topic=security" className="mt-4 mr-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-indigo-200">
            Send a private message <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}?subject=Security%20report`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-indigo-200 break-all">
            {CONTACT_EMAIL} <ArrowRight className="w-4 h-4 shrink-0" />
          </a>
        </div>
      </section>

      <p className="mt-10 text-sm text-slate-500">
        More detail is in our <Link to="/terms" className="underline hover:text-slate-300">Terms</Link> and{" "}
        <Link to="/privacy" className="underline hover:text-slate-300">Privacy Policy</Link>.
      </p>
    </PublicLayout>
  );
}
