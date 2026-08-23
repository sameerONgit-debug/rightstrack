import { analyzePrompt, fallbackAnalysis } from '@/lib/serverAi';

export async function POST(request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) {
      return Response.json({ error: { code: 'INVALID_INPUT', message: 'A situation prompt is required.' } }, { status: 400 });
    }

    const supportedLanguages = new Set(['en', 'hi', 'mr', 'bn', 'ta']);
    const language = supportedLanguages.has(body?.language) ? body.language : 'en';
    return Response.json(await analyzePrompt(prompt, language));
  } catch (error) {
    console.error('POST /api/analyze error:', error);
    return Response.json(fallbackAnalysis(), { status: 200 });
  }
}
