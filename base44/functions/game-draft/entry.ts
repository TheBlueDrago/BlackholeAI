import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');

    const list = await base44.entities.GameDraft.filter({});
    const mine = (list || []).find((d) => d.created_by_id === user.id);

    if (action === 'load') {
      if (!mine) return Response.json({ draft: null });
      let html = mine.htmlUrl || '';
      if (/^https?:\/\//.test(html)) {
        try {
          const r = await fetch(html);
          html = await r.text();
        } catch (e) {
          return Response.json({ error: 'Could not read draft: ' + e.message }, { status: 500 });
        }
      }
      return Response.json({
        draft: {
          gameName: mine.gameName,
          title: mine.title || '',
          genre: mine.genre || 'io',
          html,
          userTurns: mine.userTurns || [],
          projectId: mine.projectId || ''
        }
      });
    }

    if (action === 'save') {
      const html = String(body.html || '');
      let htmlUrl = mine ? (mine.htmlUrl || '') : '';
      if (html) {
        const file = new File([html], 'draft.html', { type: 'text/html' });
        const up = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        htmlUrl = up.file_url;
      }
      const data = {
        gameName: String(body.gameName || 'my-game'),
        title: String(body.title || ''),
        genre: String(body.genre || 'io'),
        htmlUrl,
        userTurns: Array.isArray(body.userTurns) ? body.userTurns : [],
        projectId: String(body.projectId || '')
      };
      if (mine) {
        await base44.entities.GameDraft.update(mine.id, data);
      } else {
        await base44.entities.GameDraft.create(data);
      }
      return Response.json({ ok: true });
    }

    if (action === 'clear') {
      if (mine) await base44.entities.GameDraft.delete(mine.id);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}