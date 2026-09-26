// Messages from the /contact page, read in Monitor → Messages. Like reports, they're
// all kept in ONE KV key ("contact"), so a message costs one KV write and the Monitor
// reads them with one get; daily caps keep a flood from using up the shared 1,000
// writes/day (past a cap the message is accepted but not stored).
const KEY = "contact";
const MAX_KEEP = 200;
const DAILY_WRITES = 50;
const DAILY_PER_SENDER = 3;
export const TOPICS = { account: "Account or sign-in", billing: "Plans, credits or payments", bug: "Something isn't working", ai: "A problem with an AI reply", security: "A security problem or scam", parent: "I'm a parent or teacher", idea: "Idea or feedback", business: "Using Nebulux AI for my business", partnership: "Partnership, investment or acquisition", other: "Something else" };

async function sha(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function readAll(kv) {
  try {
    const v = await kv.get(KEY, "json");
    return v && typeof v === "object" && Array.isArray(v.messages) ? v : { messages: [] };
  } catch {
    return { messages: [] };
  }
}

export async function listMessages(kv) {
  return (await readAll(kv)).messages;
}

// Returns "added" or "limited".
export async function addMessage(kv, { topic, message, email, userId, name, who }) {
  const all = await readAll(kv);
  const today = new Date().toISOString().slice(0, 10);
  const day = all._day && all._day.date === today ? all._day : { date: today, n: 0, by: {} };
  const sender = await sha(`contact|${who || ""}`);
  if (day.n >= DAILY_WRITES || (day.by[sender] || 0) >= DAILY_PER_SENDER) return "limited";
  day.n += 1;
  day.by[sender] = (day.by[sender] || 0) + 1;
  all._day = day;
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  all.messages = [
    { id, topic, message: String(message).slice(0, 2000), email: String(email || "").slice(0, 200), userId: userId || "", name: String(name || "").slice(0, 100), at: new Date().toISOString() },
    ...all.messages,
  ].slice(0, MAX_KEEP);
  await kv.put(KEY, JSON.stringify(all));
  return "added";
}

export async function removeMessage(kv, id) {
  const all = await readAll(kv);
  const next = all.messages.filter((m) => m.id !== id);
  if (next.length === all.messages.length) return;
  all.messages = next;
  await kv.put(KEY, JSON.stringify(all));
}
