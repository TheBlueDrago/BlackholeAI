// Replaces Base44's built-in chatCompletion function, which is metered against
// Base44's monthly "integration credits" quota (10,000/mo on Builder, no rollover,
// no à la carte top-ups). This exact static path takes routing precedence over the
// catch-all proxy at functions/api/[[path]].js, so only this one function call is
// diverted — every other /api/* call (auth, entities, other functions) still goes
// to Base44 as normal. Same contract the frontend already expects:
// { prompt, model } -> { content }. See ChatBox.jsx, WebsiteDesigner.jsx,
// GamesDesigner.jsx, CodePage.jsx for callers.
//
// Backed by Google's Gemini API (free tier, no billing required) instead of a
// paid provider. The 2.5-series (flash and pro) returned "no longer available
// to new users" for this account, so tiers use confirmed-working 3.x models,
// still ordered by coding strength per the app's renamed tiers:
//   automatic         (Blackhole AI)   -> gemini-3.5-flash (mid tier, general use)
//   claude_sonnet_4_6 (Blackhole Code) -> gemini-3.6-flash (3rd-best coding)
//   claude_opus_4_8   (Galaxy)         -> gemini-3.7-flash (2nd-best coding)
//   claude-sonnet-5   (Space)          -> gemini-3.8-flash (best coding)
const MODEL_MAP = {
  automatic: "gemini-3.5-flash",
  claude_sonnet_4_6: "gemini-3.6-flash",
  claude_opus_4_8: "gemini-3.7-flash",
  "claude-sonnet-5": "gemini-3.8-flash",
};
const DEFAULT_MODEL = "gemini-3.5-flash";

// Response.json() isn't available under every Pages Functions compatibility
// date, and a missing static method throws an uncaught exception that surfaces
// to the client as a raw Cloudflare 502 with no detail — this works everywhere.
function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env.GEMINI_API_KEY) {
      return json({ error: "AI is not configured on this deployment (missing GEMINI_API_KEY)." }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }

    const prompt = (body.prompt || "").toString();
    if (!prompt) return json({ error: "prompt required" }, 400);
    const model = MODEL_MAP[body.model] || DEFAULT_MODEL;

    let res;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 8192 },
        }),
      });
    } catch (err) {
      return json({ error: "AI request failed", detail: String(err) }, 502);
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return json({ error: "AI request failed", detail: detail.slice(0, 500) }, 502);
    }

    const data = await res.json();
    const parts = (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const content = parts.map((p) => p.text || "").join("");

    return json({ content });
  } catch (err) {
    return json({ error: "Unhandled error", detail: String(err && err.stack || err) }, 500);
  }
}
