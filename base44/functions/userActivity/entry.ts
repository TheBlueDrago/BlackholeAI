import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { PLAN_TOTALS, effectivePlan } from '../../shared/planCredits.ts';

const SESSION_GAP_MS = 30 * 60 * 1000;

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (me.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const userId = typeof body.userId === 'string' ? body.userId : '';
    if (!userId) return Response.json({ error: 'userId is required' }, { status: 400 });

    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    const user = users?.[0];
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const rows = await base44.asServiceRole.entities.AiActivity.filter({ userId }, '-created_date', 500);
    const activity = rows || [];

    const plan = effectivePlan(user);
    const totals = PLAN_TOTALS[plan] || PLAN_TOTALS.free;
    const bonus = user.bonus || {};
    const thisMonth = monthKey();

    const usedThisMonth = { ai: 0, aiCode: 0, galaxy5: 0, space5: 0 };
    for (const a of activity) {
      const b = a.bucket;
      if (!(b in usedThisMonth)) continue;
      if (monthKey(new Date(a.created_date)) !== thisMonth) continue;
      usedThisMonth[b] += 1;
    }

    const credits = {};
    for (const key of Object.keys(usedThisMonth)) {
      const total = (totals[key] || 0) + Number(bonus[key] || 0);
      credits[key] = { total, used: usedThisMonth[key], remaining: Math.max(0, total - usedThisMonth[key]) };
    }

    // Time on the AI: sum of session spans (activities less than 30 minutes apart).
    const times = activity.map((a) => new Date(a.created_date).getTime()).sort((a, b) => a - b);
    let totalMs = 0;
    let sessions = 0;
    let start = null;
    let prev = null;
    for (const t of times) {
      if (start === null) { start = t; prev = t; sessions = 1; continue; }
      if (t - prev > SESSION_GAP_MS) { totalMs += prev - start; sessions += 1; start = t; }
      prev = t;
    }
    if (start !== null) totalMs += prev - start;

    return Response.json({
      plan,
      credits,
      totalPrompts: activity.length,
      sessions,
      minutesOnAi: Math.round(totalMs / 60000),
      firstSeen: times.length ? new Date(times[0]).toISOString() : null,
      lastSeen: times.length ? new Date(times[times.length - 1]).toISOString() : null,
      recent: activity.slice(0, 5).map((a) => ({ id: a.id, prompt: a.prompt, bucket: a.bucket, at: a.created_date })),
    });
  } catch (error) {
    console.error('userActivity failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}