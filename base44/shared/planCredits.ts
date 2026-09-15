// Monthly credit totals per plan — must stay in sync with src/hooks/useCredits.js.
export const PLAN_TOTALS = {
  free: { ai: 50, aiCode: 5, galaxy5: 0, space5: 0 },
  pro: { ai: 100, aiCode: 50, galaxy5: 50, space5: 50 },
  team: { ai: 150, aiCode: 100, galaxy5: 100, space5: 100 },
  secret: { ai: 150, aiCode: 100, galaxy5: 100, space5: 100 },
  admin: { ai: 150, aiCode: 100, galaxy5: 100, space5: 100 },
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