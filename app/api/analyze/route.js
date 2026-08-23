import { NextResponse } from 'next/server';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { analyze } = require('../../../lib/ai/analyze');

function readableError(error) {
  if (!error) return 'Unable to analyze the problem.';
  if (typeof error === 'string') return error;
  return error.message || error.error?.message || error.statusText || JSON.stringify(error);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { narrative } = body;

    if (!narrative || !narrative.trim()) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'INVALID_INPUT', message: 'Problem narrative is required.' } },
        { status: 400 }
      );
    }

    const originalNarrative = narrative.trim();
    const analysis = await analyze(originalNarrative);
    const domain = analysis.domain === 'Consumer'
      ? 'CONSUMER'
      : analysis.domain === 'RTI'
        ? 'RTI'
        : 'OTHER';

    return NextResponse.json({
      success: true,
      data: {
        narrative: originalNarrative,
        domain,
        confidence: analysis.confidence,
        rationale: analysis.rationale,
        suggested_category: analysis.suggested_category || '',
        is_valid_problem: analysis.is_valid_problem !== false,
        ai_generated: analysis.ai_generated === true,
        entities: analysis.extracted_fields || {},
        extracted_fields: analysis.extracted_fields || {},
        clarifications: (analysis.clarifying_questions || []).map((question, index) => ({
          id: question.field_key || `clarification_${index + 1}`,
          question: question.question_text,
          required: true,
          input_type: question.input_type || 'text',
        })),
        clarifying_questions: analysis.clarifying_questions || [],
      },
      error: null,
    });
  } catch (error) {
    const message = readableError(error);
    console.error('[Analyze API]', message, error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'ANALYSIS_ERROR', message } },
      { status: 500 }
    );
  }
}
