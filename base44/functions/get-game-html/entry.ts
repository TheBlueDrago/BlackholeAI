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
    // Fix: player 3D mesh position (x,z) and rotation were never updated in the game loop.
    if (name === 'shooting-io') {
      html = html.replace(
        'player.g.position.y=player.y;',
        'player.g.position.y=player.y;player.g.position.x=player.x;player.g.position.z=player.z;player.g.rotation.y=yaw;'
      );
    }
    // Count plays once per person (per account), server-side.
    try {
      const user = await base44.auth.me();
      if (user) {
        const played = await base44.asServiceRole.entities.GamePlay.filter({ gameName: name, userId: user.id });
        if (!played || !played.length) {
          await base44.asServiceRole.entities.GamePlay.create({ gameName: name, userId: user.id });
          await base44.asServiceRole.entities.PublishedGame.update(g.id, { plays: (g.plays || 0) + 1 });
        }
      }
    } catch {}
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