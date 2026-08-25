import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Owner-only: removes the given member emails from the team.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
    const db = base44.asServiceRole;
    const owned = (await db.entities.Team.filter({ ownerId: user.id }))?.[0];
    if (!owned) return Response.json({ error: "Only a Team owner can remove members." }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const toRemove = (Array.isArray(body.emails) ? body.emails : [body.emails])
      .map((e) => String(e ?? "").trim().toLowerCase())
      .filter(Boolean);

    const members = (owned.memberEmails ?? []).filter((e) => !toRemove.includes(String(e).toLowerCase()));
    const pending = (owned.pendingRemovalEmails ?? []).filter((e) => !toRemove.includes(String(e).toLowerCase()));
    await db.entities.Team.update(owned.id, { memberEmails: members, pendingRemovalEmails: pending });
    return Response.json({ memberEmails: members });
  } catch (error) {
    console.error("team-remove: unhandled error", error);
    return Response.json({ error: "Could not remove member." }, { status: 500 });
  }
}