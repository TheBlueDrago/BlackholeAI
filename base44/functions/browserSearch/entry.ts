import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Blackhole Browser web search: returns a short AI answer plus web-style result links.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.trim().slice(0, 300) : '';
    if (!query) return Response.json({ error: 'Query is required' }, { status: 400 });

    const prompt = [
      'You are the search engine behind "Blackhole Browser". Answer the user query like a search engine result page.',
      'Query: ' + query,
      '',
      'Rules:',
      '- answer: a direct, correct, concise answer (1-3 sentences). If the query is math like "2+2", answer with the computed result. If it is a definition, unit conversion, weather-style, how-to or everyday question, answer it directly. Never refuse.',
      '- answerLabel: 2-4 word label for the answer type (e.g. "Calculator", "Quick answer", "Definition", "Conversion").',
      '- results: 6 to 10 real, well-known web pages that genuinely relate to the query. url must be a real full https URL on a real site. title is the page title, site is the display domain, description is a 1-2 sentence snippet.',
      '- Never invent fake domains.'
    ].join('\n');

    const data = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          answerLabel: { type: 'string' },
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                url: { type: 'string' },
                site: { type: 'string' },
                description: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const results = Array.isArray(data?.results) ? data.results.filter((r) => r && r.url && r.title) : [];
    return Response.json({
      answer: typeof data?.answer === 'string' ? data.answer : '',
      answerLabel: typeof data?.answerLabel === 'string' ? data.answerLabel : 'Quick answer',
      results
    });
  } catch (error) {
    console.error('browserSearch failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}