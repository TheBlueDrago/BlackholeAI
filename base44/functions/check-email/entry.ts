import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Public pre-registration check. Returns whether an email is available, already in use,
// or belonged to an account that has since been deleted (so re-registration is blocked).
// Identity is tracked by email in the SeenEmail entity (populated as users log in).
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email) {
      return Response.json({ status: "invalid" }, { status: 400 });
    }

    // Has this email ever been seen (registered) in the app?
    const seen = await db.entities.SeenEmail.filter({ email });
    if (!seen || seen.length === 0) {
      return Response.json({ status: "available" });
    }

    // Seen before — is there still an active user with this email?
    const active = await db.entities.User.filter({ email });
    if (active && active.length > 0) {
      return Response.json({ status: "exists" });
    }

    // Seen before but no active user → the account was deleted.
    return Response.json({ status: "deleted" });
  } catch (error) {
    console.error("check-email: unhandled error", error);
    return Response.json({ status: "error" }, { status: 500 });
  }
}