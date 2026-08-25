import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Mark the caller to leave the team at the end of the current period (promo expiry, or
// when the Wix subscription is canceled — the app itself can't cancel a Wix subscription).
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
    const email = String(user.email ?? "").trim().toLowerCase();
    const db = base44.asServiceRole;

    const owned = (await db.entities.Team.filter({ ownerId: user.id }))?.[0];
    if (owned) {
      await db.entities.Team.update(owned.id, { ownerLeaving: true });
      return Response.json({
        ok: true,
        role: "owner",
        message: "Your membership will continue until the end of the current period, then end. Cancel the Wix subscription too to stop future charges.",
      });
    }

    if (!email) return Response.json({ error: "No email on your account." }, { status: 400 });
    const memberTeams = await db.entities.Team.filter({ memberEmails: email });
    const team = memberTeams?.[0];
    if (!team) return Response.json({ error: "You are not on a team." }, { status: 403 });

    const pending = (team.pendingRemovalEmails ?? []).map((e) => String(e).toLowerCase());
    if (!pending.includes(email)) pending.push(email);
    await db.entities.Team.update(team.id, { pendingRemovalEmails: pending });
    return Response.json({
      ok: true,
      role: "member",
      message: "You'll keep access until the current period ends, then be removed from the team.",
    });
  } catch (error) {
    console.error("team-leave: unhandled error", error);
    return Response.json({ error: "Could not process leave." }, { status: 500 });
  }
}