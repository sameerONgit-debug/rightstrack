import { draftCase } from '@/lib/serverAi';

export async function POST(request) {
  try {
    const { analysis, answers } = await request.json();
    if (!analysis || !answers) {
      return Response.json({ error: { code: 'INVALID_INPUT', message: 'Analysis and answers are required.' } }, { status: 400 });
    }

    const document = await draftCase({ analysis, answers });
    const caseId = `case_${Date.now()}`;
    const citations = document.citations || document.legal_citations || analysis.citations || analysis.legal_citations || [];
    return Response.json({
      id: caseId,
      draft: document.draft,
      citations,
      caseId,
      analysis,
      answers,
      document: { ...document, citations },
    });
  } catch (error) {
    console.error('POST /api/cases error:', error);
    return Response.json({ error: { code: 'CASE_GENERATION_FAILED', message: error.message } }, { status: 500 });
  }
}
