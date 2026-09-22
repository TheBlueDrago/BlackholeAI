import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Publishes a website. The HTML is stored directly in the entity's `html` field
// rather than uploaded via base44.integrations.Core.UploadFile — that call is
// metered against Base44's monthly integration-credit quota (shared with
// chatCompletion), so once that quota is exhausted, publishing would otherwise
// fail with "You have reached the limit of integrations for this month" even
// though publishing itself does no AI work. get-site-html already handles a
// plain inline HTML string (it only fetches when the field looks like a URL),
// so this is compatible with existing published sites that still store a file URL.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const name = String(body.name || '').toLowerCase();
    const html = String(body.html || '');
    const ownerName = String(body.ownerName || '');
    if (!name || !html) return Response.json({ error: 'name and html required' }, { status: 400 });

    const MAX_BYTES = 5 * 1024 * 1024; // 5 MB, stored inline in the entity field
    if (html.length > MAX_BYTES) {
      return Response.json({ error: 'Website is too large (over 5 MB). Make it smaller.' }, { status: 413 });
    }

    const existing = await base44.asServiceRole.entities.PublishedSite.filter({ name });
    const mine = (existing || []).find((s) => s.created_by_id === user.id);
    if (existing && existing.length && !mine && user.role !== 'admin') {
      return Response.json({ error: 'That name is taken. Try another.' }, { status: 409 });
    }

    const target = mine || (existing && existing[0]);
    let rec;
    if (target) {
      rec = await base44.asServiceRole.entities.PublishedSite.update(target.id, { html, ownerName, hidden: false });
    } else {
      rec = await base44.asServiceRole.entities.PublishedSite.create({ name, html, ownerName });
    }
    return Response.json({ ok: true, id: rec.id, republished: !!target });
  } catch (error) {
    console.error('publish-site failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}