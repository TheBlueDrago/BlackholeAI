// Replaces Base44's browserSearch (Blackhole Browser's search results), which used
// Base44's metered InvokeLLM and so the Base44 integration allowance. This asks Gemini
// (the app's free-tier key) with Google Search grounding for the same shape:
// { query } -> { answer, answerLabel, results: [{ title, url, site, description }] }.
// Free for the user, so it's rate-limited per account.
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { allow, TOO_MANY } from "../../../../../cloudflare-lib/ratelimit.js";
import { familySafeText, familySafeHost } from "../../../../../cloudflare-lib/familysafe.js";

const MODELS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash"];

// Blackhole Browser is used by kids, so results are family-friendly, like SafeSearch: the
// prompt asks for that, and any adult, gambling or piracy result that still comes back is
// dropped here (cloudflare-lib/familysafe.js).
export const familySafe = (r) => {
  let host = "";
  try {
    host = new URL(r.url).hostname;
  } catch {
    // not a URL: the https check drops it anyway
  }
  return familySafeHost(host) && familySafeText(`${r.url} ${r.title} ${r.site || ""} ${r.description || ""}`);
};

function extractJson(text) {
  const t = String(text || "");
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1] : t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1);
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

// Tried in order: Google Search grounding first; if a model refuses that (not every
// model/tier supports it), a plain answer from the model's own knowledge.
const VARIANTS = [{ tools: [{ google_search: {} }] }, {}];

async function ask(apiKey, model, prompt) {
  let res;
  for (const extra of VARIANTS) {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], ...extra, generationConfig: { maxOutputTokens: 4096 } }),
    });
    // 400: this model can't search; 429: the free search quota is used up. Either way, answer without it.
    if (res.ok || ![400, 429].includes(res.status)) break;
  }
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json();
  const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
  return parts.map((p) => (p.thought ? "" : p.text || "")).join("");
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Unauthorized" }, 401);
    if (!(await allow(`search:${user.id}`, 60, 3600))) return json({ error: TOO_MANY }, 429);
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === "string" ? body.query.trim().slice(0, 300) : "";
    if (!query) return json({ error: "Query is required" }, 400);

    const prompt = [
      'You are the search engine behind "Blackhole Browser". Search the web, then answer like a search results page.',
      `Query: ${query}`,
      "",
      "Reply with ONLY a JSON object: {\"answer\": string, \"answerLabel\": string, \"results\": [{\"title\", \"url\", \"site\", \"description\"}]}",
      "- answer: a direct, correct, concise answer (1-3 sentences). Compute math; answer definitions, conversions and how-tos directly. Never refuse ordinary questions.",
      "- answerLabel: 2-4 words, e.g. \"Calculator\", \"Quick answer\", \"Definition\".",
      "- results: 6 to 10 real pages from your search. url must be a real https URL; site is the display domain; description is a 1-2 sentence snippet. Never invent domains.",
      "- Blackhole Browser is used by kids, so keep everything family-friendly, like SafeSearch: no adult, gambling, piracy or scam sites. If the query asks for those, say in the answer that Blackhole Browser keeps results family-friendly, and give only safe results for the rest of the query (or none).",
    ].join("\n");

    let data = null;
    let lastErr = "";
    for (const model of MODELS) {
      try {
        const text = await ask(env.GEMINI_API_KEY, model, prompt);
        data = extractJson(text);
        if (data) break;
        lastErr = `no JSON in reply: ${text.slice(0, 120)}`;
      } catch (err) {
        // Busy or unavailable: try the next model.
        lastErr = String((err && err.message) || err);
      }
    }
    if (!data) return json({ error: "Search is busy right now. Please try again in a minute.", detail: lastErr }, 503);
    const results = Array.isArray(data.results)
      ? data.results.filter((r) => r && typeof r.url === "string" && /^https:\/\//.test(r.url) && r.title && familySafe(r)).slice(0, 10)
      : [];
    return json({
      answer: typeof data.answer === "string" ? data.answer : "",
      answerLabel: typeof data.answerLabel === "string" ? data.answerLabel : "Quick answer",
      results,
    });
  } catch (err) {
    return json({ error: (err && err.message) || "Search failed." }, 500);
  }
}
