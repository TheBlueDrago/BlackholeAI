// How-to guides (/guides and /guides/<slug>). Plain data with no JSX so both the app
// (src/pages/Guide.jsx) and the Cloudflare function that serves each guide with its text
// already in the page for search engines (functions/guides/[slug].js) use the same words.
// Keep every claim true to the product: limits and prices here must match the app.
export const GUIDES_UPDATED = "2026-09-24";

export const GUIDES = [
  {
    slug: "ai-homework-help",
    title: "How to use AI for homework (the right way)",
    description:
      "Use AI to understand your homework, not just copy answers: ask it to explain step by step, quiz you, and check your work. Free with Blackhole AI.",
    minutes: 4,
    intro:
      "AI can be the best study partner you've ever had, or a shortcut that leaves you stuck on the test. The difference is how you ask. Here's how to use Blackhole AI so you actually learn.",
    sections: [
      {
        heading: "Ask it to explain, not just answer",
        paragraphs: ["Instead of pasting the question and copying the reply, ask the AI to teach you. It's patient, and you can ask the same thing again as many times as you need."],
        list: ["\"Explain photosynthesis like I'm 10.\"", "\"Show me how to solve this step by step, and stop before the last step so I can try it.\"", "\"Why is this the answer? What's the rule behind it?\""],
      },
      {
        heading: "Send a picture of the problem",
        paragraphs: ["Take a photo of the worksheet or textbook page and send it in the chat (up to 3 pictures at once), then ask about it. Typing on a phone? Tap the microphone and just say your question."],
      },
      {
        heading: "Let it quiz you",
        paragraphs: ["Before a test, ask the AI to quiz you. It can make practice questions at your level, tell you what you got wrong, and explain why."],
        list: ["\"Give me 5 practice questions on fractions, one at a time.\"", "\"Quiz me on the causes of World War I and tell me what I missed.\""],
      },
      {
        heading: "Check your own work",
        paragraphs: ["Do the work yourself first, then ask the AI to check it and point out mistakes without rewriting the whole thing. You'll remember it far better."],
      },
      {
        heading: "Know the limits",
        list: [
          "AI can make mistakes, so double-check facts that matter, and follow your teacher's rules about using AI.",
          "Don't share private details like your address, phone number or passwords. Blackhole AI warns you if a message looks like it has them.",
          "Handing in AI's words as your own isn't learning. Use it to understand, then write it yourself.",
        ],
      },
    ],
    cta: { label: "Start studying free", to: "/register?returnTo=%2Fchat" },
    more: { label: "For parents and teachers", to: "/safety#parents" },
    related: ["make-a-website-on-your-phone", "make-a-website-with-ai"],
  },
  {
    slug: "make-a-website-with-ai",
    title: "How to make a website for free with AI",
    description:
      "Make a real website without coding: describe it, let the AI build it, change anything by chatting, and publish it free with your own link.",
    minutes: 4,
    intro:
      "You don't need to know how to code, pay for hosting or wrestle with a page builder to have a website. With Blackhole AI you describe the site you want in plain words, and the AI builds it in about a minute. Here's how, step by step.",
    sections: [
      {
        heading: "What you need",
        paragraphs: ["A phone or computer with a web browser, and a free Blackhole AI account. No coding, no hosting to set up and no credit card."],
      },
      {
        heading: "Step 1: Describe your site",
        paragraphs: [
          "Open the Website Designer and write a sentence or two about the site. The more specific you are, the closer the first version will be: say who it's for, which sections you want and the look you like.",
        ],
        list: [
          "\"A site for my dog-walking business in Austin, with prices, reviews and a way to book.\"",
          "\"A page for our school's robotics club with meeting times and last season's projects.\"",
          "\"A dark, modern portfolio for my photography, with a big photo grid.\"",
        ],
      },
      {
        heading: "Step 2: Or start from a template",
        paragraphs: [
          "If you'd rather start from something finished, pick one of the free templates: a local business, a restaurant menu, an event invite, a resume and more. You can try each one full screen before you choose, then change anything about it.",
        ],
      },
      {
        heading: "Step 3: Change anything by chatting",
        paragraphs: [
          "Tell the AI what to change, the same way you'd tell a person. You can ask for one change at a time or several at once, and every version is kept, so you can go back to an earlier one. If you know some HTML, the Edit code tab lets you change the page by hand too.",
        ],
        list: ["\"Make the header dark blue and the buttons orange.\"", "\"Add a section with three customer reviews.\"", "\"Make it look great on phones.\""],
      },
      {
        heading: "Step 4: Publish and share",
        paragraphs: [
          "Press Publish and choose a name. Your site goes live at yourname.blackhole-ai-tech.com, a link you can text, post or print on a flyer. Every page is checked for scams and harmful content before it goes live, so visitors can trust it.",
          "The free plan keeps one website online. Pro, at $1.50 a month, keeps three and lets you download your site's code as a ZIP or push it to GitHub.",
        ],
      },
      {
        heading: "Tips for a better site",
        list: [
          "Give each page one clear goal, like \"call us\" or \"see the menu\".",
          "Use your real words and details; the AI can polish them for you.",
          "Open it on your phone before you share it. Most visitors will.",
          "Ask the AI to \"check the page for mistakes\" before you publish.",
        ],
      },
    ],
    cta: { label: "Build your website free", to: "/register?returnTo=%2Fchat%2Fdesigner" },
    related: ["make-a-website-on-your-phone", "small-business-website"],
  },
  {
    slug: "make-a-game-without-coding",
    title: "How to make your own video game without coding",
    description:
      "Turn a game idea into something you can play and share: describe it to the AI, test it, tweak it by chatting and publish it with one link.",
    minutes: 4,
    intro:
      "Everyone has a game idea. With Blackhole AI's Games Designer you can turn yours into a real game that runs in any browser, on phones too, without writing code. Here's how to go from idea to a link your friends can play.",
    sections: [
      {
        heading: "Start with a simple idea",
        paragraphs: [
          "The best first games do one thing well. Think of a single action the player repeats and a reason to keep going: a better score, a faster level, one more try.",
        ],
        list: ["Jump over obstacles that speed up over time", "Catch falling things and dodge the bad ones", "Fly through gaps without touching the walls", "Find the way out of a maze before time runs out"],
      },
      {
        heading: "Describe it to the Games Designer",
        paragraphs: [
          "Open the Games Designer, pick a style and describe the game: what the player controls, how you score, how you lose and how it should look. For example: \"A neon space game where I steer a ship left and right to dodge asteroids. I get a point for every second I survive, and it gets faster.\"",
          "The AI builds a complete game with a start screen, scoring, rising difficulty and a game-over screen with a restart button.",
        ],
      },
      {
        heading: "Play it and fix what feels off",
        paragraphs: [
          "Play it right away in the preview. If something feels wrong, say so in plain words and the AI changes it.",
        ],
        list: ["\"It's too hard at the start. Make the first 20 seconds slower.\"", "\"Make jumping floatier.\"", "\"Save my high score.\"", "\"Add a power-up that makes me invincible for 5 seconds.\""],
      },
      {
        heading: "It works on phones",
        paragraphs: [
          "Games are made to work on phones and tablets as well as computers: on a touch screen the game shows on-screen buttons for every move, so nobody needs a keyboard.",
        ],
      },
      {
        heading: "Publish and share",
        paragraphs: [
          "Press Publish and your game gets its own link, like blackhole-ai-tech.com/play/yourgame. Anyone can play it straight in their browser with no download and no account. The free plan publishes one game a month; Pro publishes three.",
        ],
      },
      {
        heading: "Get inspired",
        paragraphs: ["Play the games in the Arcade to see what's possible. Every one of them was made by describing it to Blackhole AI."],
      },
    ],
    cta: { label: "Make a game free", to: "/register?returnTo=%2Fchat%2Fgame-designer" },
    more: { label: "Play the Arcade", to: "/arcade" },
    related: ["make-a-website-with-ai", "make-a-website-on-your-phone"],
  },
  {
    slug: "small-business-website",
    title: "How to put your small business online in an afternoon",
    description:
      "A simple plan for a small business website: what to put on it, how to build it with AI, and how to get it in front of customers.",
    minutes: 5,
    intro:
      "Customers look you up before they call, visit or buy. A simple website with the right details wins you those customers, and it doesn't have to take weeks or cost hundreds of dollars. Here's a plan you can finish this afternoon.",
    sections: [
      {
        heading: "What your site needs",
        paragraphs: ["Most small business sites need only a few things. Get these right before anything fancy:"],
        list: [
          "What you do and where, in one sentence at the top",
          "Your services with prices, or your menu",
          "Opening hours and address, with a map link",
          "A phone number people can tap to call, and an email",
          "A few photos and reviews from real customers",
        ],
      },
      {
        heading: "Build it",
        paragraphs: [
          "Start from the Local business or Restaurant template, or describe your business to the Website Designer. Then tell the AI your real details: \"Change the name to Rosa's Bakery, put our hours as 7am to 3pm Tuesday to Sunday, and use these prices...\" You can paste in text you already have, like a menu or a flyer.",
        ],
      },
      {
        heading: "Make contacting you easy",
        paragraphs: [
          "Ask for a big \"Call us\" button that dials your number on a phone, and an email link. The booking forms in the templates show a thank-you message but don't send the details anywhere yet, so for now ask the AI to make the booking button open an email to you, or put your phone number right next to it.",
        ],
      },
      {
        heading: "Get found",
        paragraphs: ["Publish your site, then put the link everywhere customers already look:"],
        list: [
          "The website field of your Google Business Profile",
          "Your Instagram, Facebook and TikTok bios",
          "Business cards, flyers and your shop window, as a QR code",
          "Your email signature and receipts",
        ],
      },
      {
        heading: "Keep it fresh",
        paragraphs: [
          "New hours, a holiday special or a price change takes a minute: open your site, tell the AI what changed and publish again. The link stays the same.",
        ],
      },
      {
        heading: "When you grow",
        paragraphs: [
          "The Team plan, $6 a month, lets up to three people work on your sites and share one pool of AI credits. On Pro and Team you can also download your site's code or push it to GitHub, so it's always yours.",
        ],
      },
    ],
    cta: { label: "Get your business online", to: "/register?returnTo=%2Fchat%2Fdesigner%3Ftemplate%3Dbusiness" },
    more: { label: "Try the business template", to: "/templates?preview=business" },
    related: ["make-a-website-with-ai", "resume-website"],
  },
  {
    slug: "resume-website",
    title: "How to make a resume website that stands out",
    description:
      "A personal website shows who you are better than a PDF. Here's what to put on it and how to make one free with AI in a few minutes.",
    minutes: 4,
    intro:
      "A resume website is a link you can put on every application, profile and email. It works on phones, shows your personality and lets you show your work instead of just listing it. Here's how to make one that gets noticed.",
    sections: [
      {
        heading: "What to include",
        list: [
          "Your name and a one-line description of what you do",
          "A short \"about\" paragraph in your own voice",
          "Experience, with a result for each role (\"cut support tickets by a third\")",
          "Projects, with a picture or link for each",
          "Your skills, and a clear button to get in touch",
        ],
      },
      {
        heading: "Build it in minutes",
        paragraphs: [
          "Start from the Resume template (or Portfolio, if your work is visual), then paste in your current resume and ask the AI: \"Fill this page with my details from this resume.\" It rewrites the page with your experience and skills, and you can fix anything by chatting.",
        ],
      },
      {
        heading: "Keep your private details private",
        paragraphs: [
          "Your site is public, so leave off your home address and personal phone number. An email address is enough for recruiters to reach you. You can make a separate email just for job hunting.",
        ],
      },
      {
        heading: "Make it yours",
        list: ["\"Use a dark green color scheme.\"", "\"Add a projects section with three cards.\"", "\"Make my name bigger and add a short tagline under it.\""],
      },
      {
        heading: "Share it",
        paragraphs: [
          "Publish it at yourname.blackhole-ai-tech.com, then add the link to your job applications, your LinkedIn profile and your email signature. When something changes, update the page by chatting and publish again. The link stays the same.",
        ],
      },
    ],
    cta: { label: "Make your resume site free", to: "/register?returnTo=%2Fchat%2Fdesigner%3Ftemplate%3Dresume" },
    more: { label: "Preview the resume template", to: "/templates?preview=resume" },
    related: ["make-a-website-with-ai", "make-a-website-on-your-phone"],
  },
  {
    slug: "make-a-website-on-your-phone",
    title: "How to make a website on your phone",
    description:
      "No computer? You can build and publish a real website from an iPhone or Android phone. Here's how, step by step, in about ten minutes.",
    minutes: 3,
    intro:
      "You don't need a laptop to make a website. Blackhole AI works in your phone's browser, so you can build, change and publish a real site from the couch or the bus. Here's how.",
    sections: [
      {
        heading: "Step 1: Open Blackhole AI and sign up",
        paragraphs: [
          "Go to blackhole-ai-tech.com in Safari, Chrome or any browser and make a free account. There's nothing to download. On Android you can also install it like an app for one-tap access.",
        ],
      },
      {
        heading: "Step 2: Say or type your idea",
        paragraphs: [
          "Open the Website Designer and describe your site. Typing on a phone is slow, so tap the microphone and just say it: \"A website for my nail salon with prices, photos and our hours.\" Your words appear in the box for you to check before you send.",
        ],
      },
      {
        heading: "Step 3: Preview and change it",
        paragraphs: [
          "The preview sits right under the chat, so you see each change as it happens, just as visitors will. Ask for changes one at a time; short requests like \"make the buttons bigger\" work best on a small screen.",
        ],
      },
      {
        heading: "Step 4: Publish and share",
        paragraphs: [
          "Press Publish, pick a name, and your site is live at yourname.blackhole-ai-tech.com. Share the link by text, in your social bios, or anywhere else people find you.",
        ],
      },
      {
        heading: "Tips for phone builders",
        list: [
          "Ask for \"big buttons and text that's easy to read on phones\"; your visitors are on phones too.",
          "Start from a template to save typing.",
          "Your work saves on your phone as you go, and once a site is published you can open it again from any device you sign in on.",
        ],
      },
    ],
    cta: { label: "Start building on your phone", to: "/register?returnTo=%2Fchat%2Fdesigner" },
    related: ["make-a-website-with-ai", "make-a-game-without-coding"],
  },
];

export const guideBySlug = (slug) => GUIDES.find((g) => g.slug === slug) || null;

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// The guide as plain HTML, put inside the app page's #root so search engines and link
// previews read the whole article before the app loads (React replaces it on start).
export function guideHtml(g) {
  const sections = g.sections
    .map(
      (s) =>
        `<h2>${esc(s.heading)}</h2>` +
        (s.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("") +
        (s.list ? `<ul>${s.list.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>` : "")
    )
    .join("");
  return (
    `<article style="max-width:720px;margin:0 auto;padding:48px 20px;font:17px/1.7 system-ui,sans-serif;color:#cbd5e1;background:#020617;min-height:100vh">` +
    `<p><a href="/guides" style="color:#a5b4fc">Guides</a></p>` +
    `<h1 style="color:#fff;font-size:36px;line-height:1.2">${esc(g.title)}</h1>` +
    `<p>${esc(g.intro)}</p>${sections}` +
    `<p><a href="${esc(g.cta.to)}" style="color:#a5b4fc">${esc(g.cta.label)}</a></p></article>`
  );
}

// The /guides list as plain HTML, for the same reason.
export function guidesListHtml() {
  const items = GUIDES.map((g) => `<li><a href="/guides/${esc(g.slug)}" style="color:#a5b4fc">${esc(g.title)}</a><br>${esc(g.description)}</li>`).join("");
  return (
    `<main style="max-width:720px;margin:0 auto;padding:48px 20px;font:17px/1.7 system-ui,sans-serif;color:#cbd5e1;background:#020617;min-height:100vh">` +
    `<h1 style="color:#fff">Guides: learn to make things with AI</h1><ul>${items}</ul></main>`
  );
}

// Schema.org Article data for search results. "<" is escaped so the text can't end the
// <script> tag early.
export function guideJsonLd(g, origin) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.description,
    dateModified: GUIDES_UPDATED,
    datePublished: GUIDES_UPDATED,
    author: { "@type": "Organization", name: "Blackhole AI", url: origin + "/" },
    publisher: { "@type": "Organization", name: "Blackhole AI", logo: { "@type": "ImageObject", url: origin + "/og-image.jpg" } },
    image: origin + "/og-image.jpg",
    mainEntityOfPage: origin + "/guides/" + g.slug,
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}
