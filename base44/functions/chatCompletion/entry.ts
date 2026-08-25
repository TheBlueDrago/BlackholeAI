import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    if (!prompt.trim()) return Response.json({ error: 'Prompt is required' }, { status: 400 });
    if (prompt.length > 8000) return Response.json({ error: 'Prompt too long' }, { status: 400 });

    const model = typeof body.model === 'string' && body.model ? body.model : 'automatic';

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, model });
    const content = typeof result === 'string'
      ? result
      : result && typeof result.content === 'string'
        ? result.content
        : JSON.stringify(result ?? '');

    return Response.json({ content });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}