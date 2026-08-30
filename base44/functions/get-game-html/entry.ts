import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || '');
    if (!name) return Response.json({ error: 'name required' }, { status: 400 });
    const list = await base44.asServiceRole.entities.PublishedGame.filter({ name });
    const g = list && list[0];
    if (!g) return Response.json({ error: 'not found' }, { status: 404 });
    let html = g.html || '';
    if (/^https?:\/\//.test(html)) {
      const r = await fetch(html);
      html = await r.text();
    }
    return Response.json({
      html,
      id: g.id,
      title: g.title || g.name,
      genre: g.genre,
      plays: g.plays
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}