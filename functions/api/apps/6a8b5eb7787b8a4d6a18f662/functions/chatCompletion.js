// Replaces Base44's built-in chatCompletion function, which is metered against
// Base44's monthly "integration credits" quota (10,000/mo on Builder, no rollover,
// no à la carte top-ups). This exact static path takes routing precedence over the
// catch-all proxy at functions/api/[[path]].js, so only this one function call is
// diverted — every other /api/* call (auth, entities, other functions) still goes
// to Base44 as normal. Contract: { prompt, model, effort?, images? } -> { content, model, effort }.
// images: up to MAX_IMAGES [{ mimeType, data (base64) }] the user attached, sent to the
// model with the prompt (the app shrinks them first).
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
import { allow } from "../../../../../cloudflare-lib/ratelimit.js";

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

const MAX_IMAGES = 3;
const MAX_IMAGE_B64 = 2_000_000; // ~1.5 MB per image
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// The prompt as Gemini "parts": the text, then any attached images. Returns an error
// message instead when the images aren't acceptable.
function promptParts(prompt, images) {
  if (!Array.isArray(images) || !images.length) return prompt;
  if (images.length > MAX_IMAGES) return { error: `Attach at most ${MAX_IMAGES} images.` };
  const parts = [{ text: prompt }];
  for (const img of images) {
    const mimeType = String((img && img.mimeType) || "");
    const data = String((img && img.data) || "");
    if (!IMAGE_TYPES.includes(mimeType) || !/^[A-Za-z0-9+/=]+$/.test(data)) return { error: "That image type isn't supported." };
    if (data.length > MAX_IMAGE_B64) return { error: "An attached image is too large." };
    parts.push({ inline_data: { mime_type: mimeType, data } });
  }
  return parts;
}

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
// onDelta receives each new piece of text; once maxChars is reached the call stops
// there (the user's credits ran out) and returns { text, cut: true }. If shouldStop()
// turns true (the user pressed Stop and the app hung up), it stops there too and
// returns { text, stopped: true }, so only what was written is charged.
async function generate(apiKey, model, prompt, generationConfig, timeoutMs, { onDelta, maxChars = Infinity, shouldStop } = {}) {
  const ctrl = new AbortController();
  const timer = timeoutMs ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  let res;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ parts: typeof prompt === "string" ? [{ text: prompt }] : prompt }], generationConfig }),
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
  let cut = false;
  let streamError = null;
  const add = (text) => {
    if (cut || !text) return;
    const room = maxChars - out.length;
    if (text.length >= room) {
      text = text.slice(0, Math.max(0, room));
      cut = true;
    }
    out += text;
    if (text && onDelta) onDelta(text);
  };
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
    for (const p of parts) if (p.text && !p.thought) add(p.text);
  };
  let stopped = false;
  while (!cut) {
    if (shouldStop && shouldStop()) {
      stopped = true;
      break;
    }
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while (!cut && (nl = buf.indexOf("\n")) >= 0) {
      handleLine(buf.slice(0, nl).trim());
      buf = buf.slice(nl + 1);
    }
  }
  if (cut || stopped) reader.cancel().catch(() => {});
  else handleLine(buf.trim());
  if (!out && streamError) {
    const code = Number(streamError.code) || 0;
    throw new GeminiError(streamError.message || "Gemini stream error", { status: code, retryable: RETRYABLE.has(code) });
  }
  return { text: out, cut, stopped };
}

// Tries the model with the effort's thinking settings; if the model rejects those
// settings, retries once without them rather than failing the request.
async function generateWithEffort(apiKey, model, prompt, effort, timeoutMs, maxTokens, opts) {
  const { thinkingConfig } = EFFORT[effort];
  const maxOutputTokens = maxTokens || EFFORT[effort].maxOutputTokens;
  try {
    return await generate(apiKey, model, prompt, { maxOutputTokens, thinkingConfig }, timeoutMs, opts);
  } catch (err) {
    if (!(err instanceof GeminiError) || !err.badConfig) throw err;
    return generate(apiKey, model, prompt, { maxOutputTokens }, timeoutMs, opts);
  }
}

// Runs the fallback chain. Once any text has been sent to the user we can't switch
// models, so a failure after that point is reported instead of retried.
async function runChain(apiKey, chain, prompt, effort, maxTokens, opts) {
  let lastErr = null;
  let started = false;
  const onDelta = opts.onDelta
    ? (t) => {
        started = true;
        opts.onDelta(t);
      }
    : undefined;
  for (let i = 0; i < chain.length; i++) {
    const isLast = i === chain.length - 1;
    try {
      const r = await generateWithEffort(apiKey, chain[i], prompt, effort, isLast ? 0 : HEADERS_TIMEOUT_MS, maxTokens, { ...opts, onDelta });
      return { ...r, model: chain[i] };
    } catch (err) {
      lastErr = err;
      if (started || !(err instanceof GeminiError) || !err.retryable) break;
    }
  }
  throw lastErr || new GeminiError("No model available");
}

function failure(err) {
  const busy = err instanceof GeminiError && err.retryable;
  return {
    error: busy
      ? "The AI is very busy right now (Google's free tier is overloaded). Please try again in a minute."
      : "The AI couldn't answer that request.",
    detail: err ? String(err.message).slice(0, 500) : "",
  };
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

    // Internal calls (naming a chat) are quick, tiny and free — but still need a signed-in
    // user. Since they're free, they're held to the basic model, a short prompt and a
    // per-user rate, so they can't be used as unlimited free AI (the Gemini free-tier
    // quota is shared by everyone's chats).
    const internal = !!body.internal;
    if (internal) {
      if (prompt.length > 1500) return json({ error: "Internal prompt too long." }, 400);
      if (!(await allow(`internal:${user.id}`, 30, 3600))) return json({ error: "Too many requests." }, 429);
    }
    const requested = internal ? DEFAULT_MODEL : MODEL_MAP[body.model] || DEFAULT_MODEL;
    const tier = TIER_OF_MODEL[body.model] || "ai";
    const effort = internal ? "low" : EFFORT[body.effort] ? body.effort : DEFAULT_EFFORT;
    const mult = EFFORT_MULT[effort];

    let left = Infinity;
    if (!internal) {
      const before = await creditStatus(kv, ent);
      left = before.tiers[tier].remaining;
      if (before.tiers[tier].total <= 0) {
        return json(
          { error: `You don't have any ${TIER_NAMES[tier]} credits. Refer friends (Account → Refer friends) or upgrade to get some.`, outOfCredits: true, credits: before },
          402
        );
      }
      if (left < mult) {
        return json(
          {
            error: left > 0
              ? `You have ${left} ${TIER_NAMES[tier]} credit${left === 1 ? "" : "s"} left — not enough for ${effort} effort (costs at least ${mult}). Lower the effort level.`
              : `You've run out of ${TIER_NAMES[tier]} credits. Buy credits or a plan in the Shop, or invite a friend and you both get free credits (Settings → Refer friends).`,
            outOfCredits: true,
            credits: before,
          },
          402
        );
      }
    }

    const input = internal ? prompt : promptParts(prompt, body.images);
    if (input && input.error) return json({ error: input.error }, 400);

    const chain = internal ? [DEFAULT_MODEL] : [requested, ...MODELS_BY_STRENGTH.filter((m) => m !== requested)].slice(0, MAX_ATTEMPTS);
    // The reply stops at what the user's credits cover: whole credits x effort multiplier.
    const maxChars = internal ? Infinity : Math.floor(left / mult) * CHARS_PER_CREDIT;
    const maxTokens = internal ? 1024 : 0;

    // Charge for what was produced. A cut reply takes every remaining credit, which
    // pauses the chat until the user has more.
    const settle = async (text, cut, stopped) => {
      if (internal) return {};
      // Stopped by the user: what was written so far is charged (nothing if nothing was).
      if (stopped && !text) return { stopped: true, charged: 0 };
      const cost = cut ? left : creditsFor(text, effort);
      // `question` is the user's own words (the prompt adds instructions), for Monitor's activity view.
      await charge(kv, ent, tier, cost, String(body.question || prompt).slice(0, 300));
      return { cut, charged: cost, credits: await creditStatus(kv, ent) };
    };

    if (!body.stream) {
      try {
        const r = await runChain(env.GEMINI_API_KEY, chain, input, effort, maxTokens, { maxChars });
        return json({ content: r.text, model: r.model, effort, ...(await settle(r.text, r.cut)) });
      } catch (err) {
        // 503 rather than 502: Cloudflare replaces 502 bodies on the custom domain with a
        // bare "error code: 502", which hid this message from users.
        return json(failure(err), 503);
      }
    }

    // Streaming: newline-delimited JSON — {"delta": "..."} pieces as the model writes,
    // then one {"done": true, ...} (or {"error": ...}) line at the end.
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const enc = new TextEncoder();
    // If the app hangs up (the user pressed Stop), writes start failing: stop generating
    // and charge only for what was written.
    let gone = false;
    const hangUp = () => {
      gone = true;
    };
    writer.closed.catch(hangUp);
    if (request.signal) request.signal.addEventListener("abort", hangUp);
    const send = (obj) => writer.write(enc.encode(JSON.stringify(obj) + "\n")).catch(hangUp);
    context.waitUntil(
      (async () => {
        try {
          const r = await runChain(env.GEMINI_API_KEY, chain, input, effort, maxTokens, { maxChars, onDelta: (t) => send({ delta: t }), shouldStop: () => gone });
          await send({ done: true, model: r.model, effort, ...(await settle(r.text, r.cut, r.stopped)) });
        } catch (err) {
          await send({ ...failure(err), status: 503 });
        } finally {
          await writer.close().catch(() => {});
        }
      })()
    );
    return new Response(readable, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" } });
  } catch (err) {
    return json({ error: "Unhandled error", detail: String((err && err.stack) || err) }, 500);
  }
}
