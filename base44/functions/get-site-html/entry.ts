import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Returns the full HTML of a published website, fetching the hosted file when the
// entity stores a file URL instead of inline HTML.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || '').toLowerCase();
    if (!name) return Response.json({ error: 'name required' }, { status: 400 });

    const list = await base44.asServiceRole.entities.PublishedSite.filter({ name });
    const site = list && list[0];
    if (!site) return Response.json({ error: 'not found' }, { status: 404 });

    let html = site.html || '';
    if (/^https?:\/\//.test(html)) {
      const r = await fetch(html);
      html = await r.text();
    }
    return Response.json({ html, id: site.id, name: site.name, ownerName: site.ownerName });
  } catch (error) {
    console.error('get-site-html failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}