import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const name = String(body.name || '');
    const html = String(body.html || '');
    const title = String(body.title || '');
    const genre = String(body.genre || 'io');
    const ownerName = String(body.ownerName || '');
    const plays = body.plays;
    if (!name || !html) {
      return Response.json({ error: 'name and html required' }, { status: 400 });
    }
    // Hard cap: 1 GB. Stops absurd uploads (e.g. a full game's source tree).
    const MAX_BYTES = 1 * 1024 * 1024 * 1024;
    if (html.length > MAX_BYTES) {
      return Response.json({ error: 'Game is too large (over 1 GB). Make it smaller.' }, { status: 413 });
    }
    const existing = await base44.asServiceRole.entities.PublishedGame.filter({ name });
    if (existing && existing[0] && existing[0].created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'That name is taken. Try another.' }, { status: 409 });
    }
    const file = new File([html], name + '.html', { type: 'text/html' });
    const up = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const file_url = up.file_url;
    const data = { html: file_url, title, genre, ownerName };
    if (typeof plays === 'number') data.plays = plays;
    let rec;
    if (existing && existing[0]) {
      rec = await base44.asServiceRole.entities.PublishedGame.update(existing[0].id, data);
    } else {
      data.name = name;
      rec = await base44.asServiceRole.entities.PublishedGame.create(data);
    }
    return Response.json({ ok: true, id: rec.id, file_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}