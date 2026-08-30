import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }
    const body = await req.json();
    const name = String(body.name || '');
    const html = String(body.html || '');
    const plays = body.plays;
    if (!name || !html) {
      return Response.json({ error: 'name and html required' }, { status: 400 });
    }
    const file = new File([html], name + '.html', { type: 'text/html' });
    const up = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const file_url = up.file_url;
    const existing = await base44.asServiceRole.entities.PublishedGame.filter({ name });
    const data = { html: file_url };
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