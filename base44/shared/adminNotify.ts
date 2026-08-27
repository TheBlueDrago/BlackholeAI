// Best-effort notification to every workspace admin. Never throws — a failed
// notification must not break the primary flow (signup, promo redemption, payment).
export async function notifyAdmins(db: any, subject: string, body: string): Promise<void> {
  try {
    const admins = await db.entities.User.filter({ role: "admin" });
    for (const a of admins ?? []) {
      const to = String(a.email ?? "").trim();
      if (!to) continue;
      try {
        await db.integrations.Core.SendEmail({ to, subject, body });
      } catch (e) {
        console.error("notifyAdmins: send failed for", to, e);
      }
    }
  } catch (e) {
    console.error("notifyAdmins: admin lookup failed", e);
  }
}