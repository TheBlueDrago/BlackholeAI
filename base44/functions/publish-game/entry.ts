import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// HTML is stored directly in the entity's `html` field rather than uploaded via
// base44.integrations.Core.UploadFile — that call is metered against Base44's
// monthly integration-credit quota (shared with chatCompletion), so once that
// quota is exhausted, publishing would otherwise fail with "You have reached
// the limit of integrations for this month" even though publishing itself does
// no AI work. get-game-html already handles a plain inline HTML string (it only
// fetches when the field looks like a URL).
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
    // 5 MB cap, stored inline in the entity field.
    const MAX_BYTES = 5 * 1024 * 1024;
    if (html.length > MAX_BYTES) {
      return Response.json({ error: 'Game is too large (over 5 MB). Make it smaller.' }, { status: 413 });
    }
    const existing = await base44.asServiceRole.entities.PublishedGame.filter({ name });
    if (existing && existing[0] && existing[0].created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'That name is taken. Try another.' }, { status: 409 });
    }
    const data = { html, title, genre, ownerName };
    if (typeof plays === 'number') data.plays = plays;
    let rec;
    if (existing && existing[0]) {
      rec = await base44.asServiceRole.entities.PublishedGame.update(existing[0].id, data);
    } else {
      data.name = name;
      rec = await base44.asServiceRole.entities.PublishedGame.create(data);
    }
    return Response.json({ ok: true, id: rec.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}