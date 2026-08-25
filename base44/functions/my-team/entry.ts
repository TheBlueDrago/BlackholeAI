import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Returns the team the current user belongs to (as owner or invited member), or null.
// "active" only while the team record is active, the owner is still on the team plan,
// and (for promo-granted teams) the promo period hasn't expired.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ team: null }, { status: 401 });

    const email = String(user.email ?? "").trim().toLowerCase();
    const db = base44.asServiceRole;

    // Admins get Team membership for free, forever — no record, no expiry, no payment.
    if (user.role === "admin") {
      return Response.json({
        team: {
          id: null,
          ownerId: user.id,
          memberEmails: [],
          pendingRemovalEmails: [],
          ownerLeaving: false,
          aiCodeUsed: 0,
          status: "active",
          active: true,
          isOwner: true,
          ownerPlanExpiresAt: null,
          isPromo: false,
          isAdmin: true,
        },
      });
    }

    const owned = await db.entities.Team.filter({ ownerId: user.id });
    let team = owned?.[0];
    let isOwner = !!team;

    if (!team && email) {
      const memberTeams = await db.entities.Team.filter({ memberEmails: email });
      team = memberTeams?.[0];
      isOwner = false;
    }

    if (!team) return Response.json({ team: null });

    const owner = await db.entities.User.get(team.ownerId).catch(() => null);
    const ownerExpiresAt = owner?.planExpiresAt ?? null;
    const expired = ownerExpiresAt ? new Date(ownerExpiresAt) < new Date() : false;
    const active = team.status === "active" && owner?.plan === "team" && !expired;

    return Response.json({
      team: {
        id: team.id,
        ownerId: team.ownerId,
        memberEmails: team.memberEmails ?? [],
        pendingRemovalEmails: team.pendingRemovalEmails ?? [],
        ownerLeaving: team.ownerLeaving ?? false,
        aiCodeUsed: team.aiCodeUsed ?? 0,
        status: team.status,
        active,
        isOwner,
        ownerPlanExpiresAt: ownerExpiresAt,
        isPromo: !!ownerExpiresAt,
      },
    });
  } catch (error) {
    console.error("my-team: unhandled error", error);
    return Response.json({ team: null }, { status: 500 });
  }
}