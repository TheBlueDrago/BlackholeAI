// Monthly credit totals per plan — must stay in sync with src/hooks/useCredits.js.
export const PLAN_TOTALS = {
  free: { ai: 10, aiCode: 5, galaxy5: 0, space5: 0 },
  pro: { ai: 25, aiCode: 15, galaxy5: 25, space5: 0 },
  team: { ai: 50, aiCode: 25, galaxy5: 40, space5: 25 },
  secret: { ai: 50, aiCode: 25, galaxy5: 40, space5: 25 },
  admin: { ai: 50, aiCode: 25, galaxy5: 40, space5: 25 },
};

// Model id → credit pool.
export const MODEL_BUCKET = {
  automatic: 'ai',
  claude_sonnet_4_6: 'aiCode',
  claude_opus_4_8: 'galaxy5',
  'claude-sonnet-5': 'space5',
};

export function effectivePlan(user) {
  if (!user) return 'free';
  if (user.role === 'admin') return 'admin';
  if (user.plan === 'secret') return 'secret';
  if (user.plan !== 'pro' && user.plan !== 'team') return 'free';
  if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) return 'free';
  return user.plan;
}