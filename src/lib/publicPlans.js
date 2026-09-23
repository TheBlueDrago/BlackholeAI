// Plans as the public pages describe them. Keep in step with PLAN_TOTALS in
// cloudflare-lib/credits.js (monthly credits), src/lib/publishLimits.js (sites and games)
// and the prices in base44/functions/create-checkout.
export const PUBLIC_PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    blurb: "Try everything and publish your first site and game.",
    features: ["50 Blackhole AI credits every month", "1 published website", "1 new game a month", "Free web address"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$1",
    period: "/month",
    blurb: "More credits, all 4 AI models and your code to keep.",
    features: [
      "100 Blackhole AI credits a month",
      "50 each of Code, Galaxy and Space credits",
      "3 published websites",
      "3 new games a month",
      "Download a ZIP or push to GitHub",
    ],
    highlight: true,
  },
  {
    id: "team",
    name: "Team",
    price: "$5",
    period: "/month",
    blurb: "Build with up to 2 friends or coworkers.",
    features: [
      "Up to 3 people, one shared pool of credits",
      "150 Blackhole AI credits a month",
      "100 each of Code, Galaxy and Space credits",
      "3 published websites, 5 new games a month",
      "Download a ZIP or push to GitHub",
    ],
  },
];
