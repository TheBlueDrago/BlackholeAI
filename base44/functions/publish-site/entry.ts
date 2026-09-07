import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Publishes a website. The HTML is stored as a hosted file (not in the entity field),
// so large sites can be published without hitting field size limits.
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

    const MAX_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
    if (html.length > MAX_BYTES) {
      return Response.json({ error: 'Website is too large (over 1 GB). Make it smaller.' }, { status: 413 });
    }

    const existing = await base44.asServiceRole.entities.PublishedSite.filter({ name });
    const mine = (existing || []).find((s) => s.created_by_id === user.id);
    if (existing && existing.length && !mine && user.role !== 'admin') {
      return Response.json({ error: 'That name is taken. Try another.' }, { status: 409 });
    }

    const file = new File([html], name + '.html', { type: 'text/html' });
    const up = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const file_url = up.file_url;

    const target = mine || (existing && existing[0]);
    let rec;
    if (target) {
      rec = await base44.asServiceRole.entities.PublishedSite.update(target.id, { html: file_url, ownerName, hidden: false });
    } else {
      rec = await base44.asServiceRole.entities.PublishedSite.create({ name, html: file_url, ownerName });
    }
    return Response.json({ ok: true, id: rec.id, file_url, republished: !!target });
  } catch (error) {
    console.error('publish-site failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}