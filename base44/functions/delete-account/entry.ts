import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

// Permanently deletes the calling user's own account. Only self-deletion is allowed —
// the user id is taken from the authenticated session, never from the request body.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    await base44.asServiceRole.entities.User.delete(user.id);
    return Response.json({ success: true });
  } catch (err) {
    console.error("delete-account: error", err);
    return Response.json({ error: err?.message || "Could not delete account" }, { status: 500 });
  }
}