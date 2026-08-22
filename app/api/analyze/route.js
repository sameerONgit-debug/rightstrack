import { analyzePrompt, fallbackAnalysis } from '@/lib/serverAi';

export async function POST(request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) {
      return Response.json({ error: { code: 'INVALID_INPUT', message: 'A situation prompt is required.' } }, { status: 400 });
    }

    return Response.json(await analyzePrompt(prompt));
  } catch (error) {
    console.error('POST /api/analyze error:', error);
    return Response.json(fallbackAnalysis(), { status: 200 });
  }
}
