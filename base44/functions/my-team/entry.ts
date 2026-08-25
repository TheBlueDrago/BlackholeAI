import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Returns the active team the current user belongs to (as owner or invited member), or null.
// A team is only "active" while the owner's subscription is still on the team plan.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ team: null }, { status: 401 });

    const email = String(user.email ?? "").trim().toLowerCase();
    const db = base44.asServiceRole;

    // Owner path.
    const owned = await db.entities.Team.filter({ ownerId: user.id });
    let team = owned?.[0];
    let isOwner = !!team;

    // Member path: array-contains match on memberEmails.
    if (!team && email) {
      const memberTeams = await db.entities.Team.filter({ memberEmails: email });
      team = memberTeams?.[0];
      isOwner = false;
    }

    if (!team) return Response.json({ team: null });

    // Active only if the team record is active AND the owner still has the team plan.
    let active = team.status === "active";
    if (active) {
      const owner = await db.entities.User.get(team.ownerId).catch(() => null);
      active = owner?.plan === "team";
    }

    return Response.json({
      team: {
        id: team.id,
        ownerId: team.ownerId,
        memberEmails: team.memberEmails ?? [],
        aiCodeUsed: team.aiCodeUsed ?? 0,
        status: team.status,
        active,
        isOwner,
      },
    });
  } catch (error) {
    console.error("my-team: unhandled error", error);
    return Response.json({ team: null }, { status: 500 });
  }
}