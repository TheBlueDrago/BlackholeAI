import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Owner-only: invites up to 3 people to the team by email. Members share the team's credits.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });

    const db = base44.asServiceRole;
    const owned = await db.entities.Team.filter({ ownerId: user.id });
    const team = owned?.[0];
    if (!team) return Response.json({ error: "Only a Team plan owner can invite members." }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const incoming = Array.isArray(body.emails) ? body.emails : [body.emails];
    const cleaned = incoming
      .map((e) => String(e ?? "").trim().toLowerCase())
      .filter((e) => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    const cap = user.plan === "secret" ? 4 : 2;
    let members = (team.memberEmails ?? []).map((e) => String(e).toLowerCase());
    for (const e of cleaned) {
      if (!members.includes(e) && members.length < cap) members.push(e);
    }
    if (members.length > cap) members = members.slice(0, cap);

    await db.entities.Team.update(team.id, { memberEmails: members });
    return Response.json({ memberEmails: members });
  } catch (error) {
    console.error("team-invite: unhandled error", error);
    return Response.json({ error: "Could not add member." }, { status: 500 });
  }
}