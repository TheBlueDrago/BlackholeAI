import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { useAuth } from "@/lib/AuthContext";

// "Things to ask AI": ready-made questions people can start from. Each opens the chat with the
// question typed in (ChatBox reads ?ask=), not sent, so nothing is charged until they press send.
export const IDEAS = [
  {
    title: "School and studying",
    items: [
      "Explain photosynthesis like I'm 10.",
      "Quiz me on the times tables, one question at a time.",
      "Help me understand this math problem step by step without giving me the answer.",
      "Make me a study plan for my science test on Friday.",
      "What's the difference between weather and climate?",
      "Give me 5 practice questions about the American Revolution.",
    ],
  },
  {
    title: "Writing",
    items: [
      "Help me plan a 5-paragraph essay about why sleep matters.",
      "Make this email to my teacher more polite: ",
      "Give me 3 ideas for a short scary story.",
      "Check my paragraph for grammar mistakes but don't rewrite it: ",
      "Help me write a thank-you note to my grandma.",
      "Write a funny poem about a cat who hates Mondays.",
    ],
  },
  {
    title: "Coding",
    items: [
      "Explain what a variable is, with a simple example.",
      "What does this error mean, and where should I look? ",
      "Help me build a tip calculator in JavaScript, step by step.",
      "Explain this code line by line like I'm new to coding: ",
      "What's the difference between HTML, CSS and JavaScript?",
      "Give me a small coding challenge for a beginner.",
    ],
  },
  {
    title: "Everyday life",
    items: [
      "Plan 5 healthy dinners I can make in 30 minutes.",
      "Help me make a weekly budget.",
      "What should I pack for a 3-day camping trip?",
      "Give me a 15-minute workout I can do at home.",
      "Help me plan a birthday party for a 10-year-old.",
      "How do I get a stain out of a white shirt?",
    ],
  },
  {
    title: "Fun and creative",
    items: [
      "Tell me a fun fact about space I probably don't know.",
      "Let's play 20 questions: you think of an animal.",
      "Invent a new board game I can play with my family.",
      "Give me 10 names for a pet goldfish.",
      "Write a short adventure story where I choose what happens.",
      "What would happen if the moon disappeared?",
    ],
  },
  {
    title: "Work and business",
    items: [
      "Write a friendly reply to a customer whose order was late.",
      "Give me a week of Instagram captions for a bakery.",
      "Help me write a product description for handmade candles.",
      "Make my resume bullet point stronger: ",
      "Help me prepare for a job interview for a store job.",
      "Explain what a profit margin is in simple words.",
    ],
  },
];

export default function Ideas() {
  const { isAuthenticated } = useAuth();
  const to = (q) => {
    const chat = "/chat?ask=" + encodeURIComponent(q);
    return isAuthenticated ? chat : "/register?returnTo=" + encodeURIComponent(chat);
  };
  return (
    <PublicLayout title="Things to ask AI">
      <section className="text-center pt-8 pb-10">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-indigo-300">
          <Lightbulb className="w-4 h-4" /> Ideas
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-bold text-white">Things to ask AI</h1>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">
          Not sure where to start? Tap any idea and it opens in the chat, ready to send or change. Free to try.
        </p>
      </section>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {IDEAS.map((g) => (
          <section key={g.title} className="rounded-3xl bg-slate-900/50 border border-slate-800 p-5">
            <h2 className="text-lg font-bold text-white">{g.title}</h2>
            <ul className="mt-3 space-y-2">
              {g.items.map((q) => (
                <li key={q}>
                  <Link
                    to={to(q)}
                    className="group flex items-center justify-between gap-3 rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-2.5 text-sm text-slate-200 hover:border-indigo-500/50 hover:bg-slate-800"
                  >
                    <span>{q.trim()}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-300 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-10 text-center text-slate-400">
        Want more? Read the{" "}
        <Link to="/guides" className="text-indigo-300 hover:text-indigo-200 underline">
          guides
        </Link>{" "}
        for tips on homework, writing and coding with AI.
      </p>
    </PublicLayout>
  );
}
