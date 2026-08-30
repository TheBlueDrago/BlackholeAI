import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Spends AI-code credits against the shared team pool. Owner or any member may spend.
// One message = 1 credit. Rejects if the team is inactive or the shared pool is exhausted.
const TEAM_AI_CODE_TOTAL = 25;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount ?? 1);
    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: "Invalid amount." }, { status: 400 });
    }

    const email = String(user.email ?? "").trim().toLowerCase();
    const db = base44.asServiceRole;

    const owned = await db.entities.Team.filter({ ownerId: user.id });
    let team = owned?.[0];
    if (!team && email) {
      const memberTeams = await db.entities.Team.filter({ memberEmails: email });
      team = memberTeams?.[0];
    }
    if (!team) return Response.json({ error: "You are not on a team." }, { status: 403 });

    // Active only if the record is active AND the owner still pays for the team plan.
    const owner = await db.entities.User.get(team.ownerId).catch(() => null);
    if (team.status !== "active" || owner?.plan !== "team") {
      return Response.json({ error: "This team is no longer active." }, { status: 403 });
    }

    const currentUsed = team.aiCodeUsed ?? 0;
    if (currentUsed + amount > TEAM_AI_CODE_TOTAL) {
      return Response.json(
        { error: "Your team is out of AI code credits.", aiCodeUsed: currentUsed, aiCodeTotal: TEAM_AI_CODE_TOTAL, exhausted: true },
        { status: 400 }
      );
    }

    const newUsed = Math.min(currentUsed + amount, TEAM_AI_CODE_TOTAL);
    await db.entities.Team.update(team.id, { aiCodeUsed: newUsed });

    return Response.json({
      aiCodeUsed: newUsed,
      aiCodeTotal: TEAM_AI_CODE_TOTAL,
      exhausted: newUsed >= TEAM_AI_CODE_TOTAL,
    });
  } catch (error) {
    console.error("team-spend: unhandled error", error);
    return Response.json({ error: "Could not spend team credits." }, { status: 500 });
  }
}