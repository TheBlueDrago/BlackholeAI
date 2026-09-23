import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Public /terms and /privacy pages, linked from sign-up, log-in, billing and the
// report page. Plain language on purpose; keep them in step with what the app does.
const UPDATED = "September 23, 2026";
// Set this to the support address people should write to; until then the pages
// point to the report form.
const CONTACT_EMAIL = "";

function Contact() {
  return CONTACT_EMAIL ? (
    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
  ) : (
    <Link to="/report">the report form</Link>
  );
}

function LegalPage({ title, other, children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 px-4 py-10">
      <article className="max-w-2xl mx-auto text-sm leading-relaxed [&_h2]:text-white [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_a]:text-indigo-300 [&_a]:underline">
        <Link to="/" className="!no-underline !text-slate-400 hover:!text-white inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="w-4 h-4" /> Blackhole AI
        </Link>
        <h1 className="text-3xl font-bold text-white mt-6">{title}</h1>
        <p className="text-slate-400 mt-1 mb-6">Last updated {UPDATED}</p>
        {children}
        <p className="mt-10 pt-4 border-t border-slate-800 text-slate-400">
          See also: <Link to={other.to}>{other.label}</Link>
        </p>
      </article>
    </div>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms of Service" other={{ to: "/privacy", label: "Privacy Policy" }}>
      <p>
        These terms cover your use of Blackhole AI at blackhole-ai-tech.com, including its AI chat, Blackhole Code,
        the Website and Game Designers, the Blackhole Browser and the sites and games people publish with it. By
        creating an account or using Blackhole AI you agree to them. If you don't agree, please don't use it.
      </p>

      <h2>Who can use it</h2>
      <ul>
        <li>You must be at least 13 years old. If you're under 18, you need a parent or guardian's permission, especially before buying anything.</li>
        <li>Keep your login to yourself. You're responsible for what happens on your account.</li>
        <li>One account per person. Creating extra accounts to collect free or referral credits isn't allowed.</li>
      </ul>

      <h2>Plans and credits</h2>
      <ul>
        <li>Using the AIs costs credits. Your plan gives you a monthly allowance, and you can also get credits from referrals, promo codes or the Blackhole AI team.</li>
        <li>Credits have no cash value, can't be sold or transferred, and may expire as described in the app.</li>
        <li>Paid plans are charged through our payment provider (Base44 Payments) at the price shown before you pay. We never see or store your full card number.</li>
        <li>Credits or rewards gained by cheating — fake sign-ups, abusing referrals, exploiting bugs — can be removed, and the account can be suspended.</li>
      </ul>

      <h2>AI answers</h2>
      <p>
        Answers, code, sites and games made by the AI can be wrong, incomplete or unsafe. Check anything important
        before relying on it, and don't use the AI for medical, legal, financial or safety decisions. You're
        responsible for how you use what it produces.
      </p>

      <h2>What you publish</h2>
      <ul>
        <li>You keep ownership of what you create. By publishing a site or game you let us host, show and copy it as needed to run Blackhole AI.</li>
        <li>Published sites and games are public: anyone with the address can see them.</li>
        <li>If you sell things on your site, you are the seller and are responsible for delivering what you sell, for refunds to your buyers and for following the law. Blackhole AI keeps a platform fee from each sale, as shown when you set up selling.</li>
      </ul>

      <h2>Not allowed</h2>
      <p>You may not use Blackhole AI, or publish anything with it, that:</p>
      <ul>
        <li>tricks people into giving passwords, card numbers or other private information (phishing);</li>
        <li>scams people, sells things that don't exist, or pretends to be another person, company or brand;</li>
        <li>spreads malware or harmful downloads, or attacks other systems;</li>
        <li>is illegal, sexual content involving minors, hate, harassment, threats, or graphic violence;</li>
        <li>copies other people's work in a way that breaks their copyright or trademark;</li>
        <li>tries to get around credit limits, bans or other safety measures, or overloads the service.</li>
      </ul>

      <h2>Reports and removal</h2>
      <p>
        Anyone can report a published site or game with the Report link on it. We can take down content, remove
        credits, or suspend or delete accounts that break these terms, with or without warning. Content that was
        taken down can't be published again under the same name.
      </p>

      <h2>No warranty</h2>
      <p>
        Blackhole AI is provided "as is". We work to keep it running, but it may change, have errors or be
        unavailable, and features, plans and prices can change. To the fullest extent the law allows, we are not
        liable for indirect or lost-profit damages, and our total liability to you is limited to what you paid us in
        the 3 months before the problem.
      </p>

      <h2>Ending</h2>
      <p>
        You can stop using Blackhole AI and delete your account at any time from your profile. We may update these
        terms; if the changes are important we'll tell you in the app, and continuing to use it means you accept them.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms? Contact us through <Contact />.</p>
    </LegalPage>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy" other={{ to: "/terms", label: "Terms of Service" }}>
      <p>This explains what Blackhole AI collects, why, and who helps us run it.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account:</strong> your email address, and your name and picture if you sign in with Google.</li>
        <li><strong>What you make:</strong> the sites and games you publish, and your game draft. Your chats and website projects are saved in your own browser, not on our servers.</li>
        <li><strong>Prompts:</strong> what you send the AI, including any images you attach in the chat, passes through our servers to Google to get an answer. We count the credits it uses but don't keep the text or images.</li>
        <li><strong>Usage:</strong> how many credits you use on each AI, your plan, promo codes you redeem, and who invited you or whom you invited. When you join through an invite link we keep a scrambled (hashed) form of your IP address with it, to spot one person creating many accounts.</li>
        <li><strong>Payments:</strong> what you bought and when. Card details go straight to the payment provider; we never see your full card number.</li>
        <li><strong>Reports:</strong> when you report a site we keep your reason and note, plus a scrambled (hashed) form of your IP address so the same person can't report one page many times.</li>
        <li><strong>Technical data:</strong> like any website, our hosting provider handles IP addresses and basic request logs to deliver pages and block attacks.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account and the features you use, and to count and enforce credits.</li>
        <li>To keep Blackhole AI safe: stopping abuse, reviewing reported content and preventing fraud.</li>
        <li>To handle payments and pay site owners for their sales.</li>
      </ul>
      <p>We don't sell your personal information and we don't show you ads.</p>

      <h2>Who helps us run it</h2>
      <ul>
        <li><strong>Base44</strong> — sign-in, the app database and payments.</li>
        <li><strong>Cloudflare</strong> — hosting, published pages, credits and drafts storage.</li>
        <li>
          <strong>Google (Gemini API)</strong> — writes the AI answers, so your prompts and chat context are sent to
          Google. On the plan we use, Google may keep them and use them to improve its products, and people at
          Google may review them.{" "}
          <strong>Don't put passwords, health information or other secrets into the AI.</strong>
        </li>
      </ul>

      <h2>What's public</h2>
      <p>
        Sites and games you publish are public, and so is anything you add to the gallery. Your chats and unpublished
        drafts are not shared with other users.
      </p>

      <h2>Stored on your device</h2>
      <p>
        We use your browser's storage for sign-in, settings such as your theme, and your chats, website projects and
        attached images. We don't use advertising or tracking cookies.
      </p>

      <h2>Keeping and deleting</h2>
      <p>
        We keep your data while your account is open. You can delete your account at any time from your profile;
        that also deletes your published sites and games, your game draft, and the chats and projects saved in that
        browser. We keep records we need for payments, fraud prevention (such as who invited whom) or the law, and a
        copy of any page we took down for breaking the rules.
      </p>

      <h2>Children</h2>
      <p>Blackhole AI isn't for children under 13, and we don't knowingly collect their information.</p>

      <h2>Changes and contact</h2>
      <p>
        If we change this policy we'll update the date above, and tell you in the app for important changes.
        Questions or requests about your data: contact us through <Contact />.
      </p>
    </LegalPage>
  );
}
