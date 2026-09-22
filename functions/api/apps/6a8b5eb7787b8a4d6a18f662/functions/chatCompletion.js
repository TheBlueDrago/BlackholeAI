// Replaces Base44's built-in chatCompletion function, which is metered against
// Base44's monthly "integration credits" quota (10,000/mo on Builder, no rollover,
// no à la carte top-ups). This exact static path takes routing precedence over the
// catch-all proxy at functions/api/[[path]].js, so only this one function call is
// diverted — every other /api/* call (auth, entities, other functions) still goes
// to Base44 as normal. Contract: { prompt, model, effort? } -> { content, model, effort }.
// See ChatBox.jsx, WebsiteDesigner.jsx, GamesDesigner.jsx, CodePage.jsx for callers.
//
// Backed by Google's Gemini API on the FREE tier (no billing) instead of a paid
// provider. The 2.5-series returned "no longer available to new users" for this
// account, so tiers use confirmed-working 3.x models, ordered by coding strength:
//   automatic         (Blackhole AI)   -> gemini-3.5-flash (mid tier, general use)
//   claude_sonnet_4_6 (Blackhole Code) -> gemini-3.6-flash (3rd-best coding)
//   claude_opus_4_8   (Galaxy)         -> gemini-3.7-flash (2nd-best coding)
//   claude-sonnet-5   (Space)          -> gemini-3.8-flash (best coding)
// On the free tier any of these can answer 503 "experiencing high demand" (or 429
// when rate-limited) at any moment; the request then falls back to the next-strongest
// model so the user still gets a reply instead of an error.
//
// Every call must come from a signed-in user and is charged server-side in whole
// credits (see cloudflare-lib/credits.js): 1 per started 10,000 characters of reply,
// times the effort level. A reply that costs more than the user has left is cut off
// at what their credits cover.
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser, entitlement, creditStatus, charge, creditsFor, CHARS_PER_CREDIT, EFFORT_MULT, TIER_OF_MODEL, TIER_NAMES } from "../../../../../cloudflare-lib/credits.js";

const MODEL_MAP = {
  automatic: "gemini-3.5-flash",
  claude_sonnet_4_6: "gemini-3.6-flash",
  claude_opus_4_8: "gemini-3.7-flash",
  "claude-sonnet-5": "gemini-3.8-flash",
};
const DEFAULT_MODEL = "gemini-3.5-flash";
// Strongest first; fallbacks are tried in this order after the requested model.
const MODELS_BY_STRENGTH = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash"];
// All four: on the free tier it's common for three of them to be overloaded at once.
const MAX_ATTEMPTS = 4;

// Effort levels (the Low…UltraCode bar in the UI): more thinking and a bigger output
// budget make replies slower but smarter. Gemini's thinkingLevel tops out at "high",
// so Extra and UltraCode use explicit, larger thinking budgets instead.
const EFFORT = {
  low: { thinkingConfig: { thinkingLevel: "low" }, maxOutputTokens: 8192 },
  medium: { thinkingConfig: { thinkingLevel: "medium" }, maxOutputTokens: 16384 },
  high: { thinkingConfig: { thinkingLevel: "high" }, maxOutputTokens: 32768 },
  extra: { thinkingConfig: { thinkingBudget: 16384 }, maxOutputTokens: 49152 },
  ultracode: { thinkingConfig: { thinkingBudget: 32768 }, maxOutputTokens: 65536 },
};
const DEFAULT_EFFORT = "medium";

// If a model hasn't even started answering within this long, give up on it and try
// the next one (overloaded models take ~20-40s just to return their 503).
const HEADERS_TIMEOUT_MS = 20000;
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

class GeminiError extends Error {
  constructor(message, { status = 0, retryable = false, badConfig = false } = {}) {
    super(message);
    this.status = status;
    this.retryable = retryable;
    this.badConfig = badConfig;
  }
}

// One streamed Gemini call. Streaming lets us tell "overloaded, never started" (fails
// fast, fall back) apart from "thinking hard" (headers arrive, then text streams in).
async function generate(apiKey, model, prompt, generationConfig, timeoutMs) {
  const ctrl = new AbortController();
  const timer = timeoutMs ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  let res;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
      signal: ctrl.signal,
    });
  } catch (err) {
    throw new GeminiError(ctrl.signal.aborted ? `${model} did not respond in time` : String(err), { retryable: true });
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 500);
    const badConfig = res.status === 400 && /thinking/i.test(detail);
    throw new GeminiError(detail || `Gemini returned ${res.status}`, { status: res.status, retryable: RETRYABLE.has(res.status), badConfig });
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let out = "";
  let streamError = null;
  const handleLine = (line) => {
    if (!line.startsWith("data:")) return;
    let chunk;
    try {
      chunk = JSON.parse(line.slice(5).trim());
    } catch {
      return;
    }
    if (chunk.error) {
      streamError = chunk.error;
      return;
    }
    const parts = (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content && chunk.candidates[0].content.parts) || [];
    for (const p of parts) if (p.text && !p.thought) out += p.text;
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      handleLine(buf.slice(0, nl).trim());
      buf = buf.slice(nl + 1);
    }
  }
  handleLine(buf.trim());
  if (!out && streamError) {
    const code = Number(streamError.code) || 0;
    throw new GeminiError(streamError.message || "Gemini stream error", { status: code, retryable: RETRYABLE.has(code) });
  }
  return out;
}

// Tries the model with the effort's thinking settings; if the model rejects those
// settings, retries once without them rather than failing the request.
async function generateWithEffort(apiKey, model, prompt, effort, timeoutMs, maxTokens) {
  const { thinkingConfig } = EFFORT[effort];
  const maxOutputTokens = maxTokens || EFFORT[effort].maxOutputTokens;
  try {
    return await generate(apiKey, model, prompt, { maxOutputTokens, thinkingConfig }, timeoutMs);
  } catch (err) {
    if (!(err instanceof GeminiError) || !err.badConfig) throw err;
    return generate(apiKey, model, prompt, { maxOutputTokens }, timeoutMs);
  }
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

    // Only signed-in users with credits left may use the AI (it runs on this app's key).
    const kv = env.PUBLISHED_HTML;
    const user = await currentUser(request);
    if (!user) return json({ error: "Please sign in to use the AI." }, 401);
    const ent = await entitlement(kv, request, user);
    if (ent.blocked) return json({ error: "Your account can't use the AI right now." }, 403);

    const requested = MODEL_MAP[body.model] || DEFAULT_MODEL;
    const tier = TIER_OF_MODEL[body.model] || "ai";
    // Internal calls (naming a chat) are quick, tiny and free — but still need a signed-in user.
    const internal = !!body.internal;
    const effort = internal ? "low" : EFFORT[body.effort] ? body.effort : DEFAULT_EFFORT;
    const mult = EFFORT_MULT[effort];

    if (!internal) {
      const before = await creditStatus(kv, ent);
      const left = before.tiers[tier].remaining;
      if (before.tiers[tier].total <= 0) {
        return json({ error: `${TIER_NAMES[tier]} isn't included in your plan. Upgrade to use it.`, outOfCredits: true, credits: before }, 402);
      }
      if (left < mult) {
        return json(
          {
            error: left > 0
              ? `You have ${left} ${TIER_NAMES[tier]} credit${left === 1 ? "" : "s"} left — not enough for ${effort} effort (costs at least ${mult}). Lower the effort level.`
              : `You've run out of ${TIER_NAMES[tier]} credits.`,
            outOfCredits: true,
            credits: before,
          },
          402
        );
      }
    }

    const chain = [requested, ...MODELS_BY_STRENGTH.filter((m) => m !== requested)].slice(0, MAX_ATTEMPTS);
    let lastErr = null;
    for (let i = 0; i < chain.length; i++) {
      const isLast = i === chain.length - 1;
      try {
        let content = await generateWithEffort(env.GEMINI_API_KEY, chain[i], prompt, effort, isLast ? 0 : HEADERS_TIMEOUT_MS, internal ? 1024 : 0);
        if (internal) return json({ content, model: chain[i], effort });

        // Charge for the reply; if it costs more than is left, cut it off at what the
        // remaining credits cover and take them all (which pauses the chat).
        const status = await creditStatus(kv, ent);
        const left = status.tiers[tier].remaining;
        let cost = creditsFor(content, effort);
        let cut = false;
        if (cost > left) {
          content = content.slice(0, Math.floor(left / mult) * CHARS_PER_CREDIT);
          cost = left;
          cut = true;
        }
        await charge(kv, ent, tier, cost);
        return json({ content, cut, charged: cost, model: chain[i], effort, credits: await creditStatus(kv, ent) });
      } catch (err) {
        lastErr = err;
        if (!(err instanceof GeminiError) || !err.retryable) break;
      }
    }

    const busy = lastErr instanceof GeminiError && lastErr.retryable;
    // 503 rather than 502: Cloudflare replaces 502 bodies on the custom domain with a
    // bare "error code: 502", which hid this message from users.
    return json(
      {
        error: busy
          ? "The AI is very busy right now (Google's free tier is overloaded). Please try again in a minute."
          : "The AI couldn't answer that request.",
        detail: lastErr ? String(lastErr.message).slice(0, 500) : "",
      },
      503
    );
  } catch (err) {
    return json({ error: "Unhandled error", detail: String((err && err.stack) || err) }, 500);
  }
}
