import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { createMimeMessage } from 'npm:mimetext@3.0.24';

const money = (n) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Scheduled runs have no user; direct calls must come from an admin.
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sales = await base44.asServiceRole.entities.SiteSale.filter({ status: 'paid' }, '-paidAt', 200);
    const fresh = (sales || []).filter((s) => s.paidAt && new Date(s.paidAt) >= since);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: authHeader });
    if (!profileRes.ok) throw new Error(`Gmail profile failed: ${await profileRes.text()}`);
    const profile = await profileRes.json();
    const to = profile.email || profile.emailAddress;
    console.log('resolved recipient', to);

    const day = new Date().toISOString().slice(0, 10);
    let body;
    if (fresh.length === 0) {
      body = `No new site sales in the last 24 hours (${day}).`;
    } else {
      const gross = fresh.reduce((s, r) => s + (parseFloat(r.gross || '0') || 0), 0);
      const fees = fresh.reduce((s, r) => s + (parseFloat(r.platformFee || '0') || 0), 0);
      const payouts = fresh.reduce((s, r) => s + (parseFloat(r.creatorPayout || '0') || 0), 0);
      const lines = fresh
        .map(
          (r) =>
            `- ${r.siteName}.blackhole | ${r.productName || r.productId} x${r.quantity || 1} | gross ${money(
              parseFloat(r.gross || '0') || 0
            )} | fee ${money(parseFloat(r.platformFee || '0') || 0)} | payout ${money(
              parseFloat(r.creatorPayout || '0') || 0
            )} | ${r.creatorEmail || ''} | ${r.paidAt}`
        )
        .join('\n');
      body =
        `Site sale payouts for the last 24 hours (${day})\n\n` +
        `Orders: ${fresh.length}\nGross: ${money(gross)}\nPlatform fees: ${money(fees)}\nCreator payouts: ${money(payouts)}\n\n` +
        `Details:\n${lines}\n`;
    }

    const msg = createMimeMessage();
    msg.setSender(to);
    msg.setRecipient(to);
    msg.setSubject(`Blackhole daily payout summary - ${day}`);
    msg.addMessage({ contentType: 'text/plain', data: body });

    const raw = btoa(msg.asRaw()).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    });
    if (!sendRes.ok) {
      const t = await sendRes.text();
      console.error('Gmail send failed', t);
      throw new Error(`Gmail send failed: ${t}`);
    }

    return Response.json({ sent: true, to, orders: fresh.length });
  } catch (error) {
    console.error('dailyPayoutEmail failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}