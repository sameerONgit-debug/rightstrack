import { NextResponse } from 'next/server';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { buildDraft } = require('../../../lib/ai/draft');
const { retrieve } = require('../../../lib/rag/retrieve');

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      domain,
      narrative = '',
      extracted_fields = {},
      extractedFields = {},
      answers = {},
      language = 'en',
    } = body;

    const normalizedDomain = String(domain || '').toUpperCase();
    if (!['RTI', 'CONSUMER', 'CONSUMER PROTECTION'].includes(normalizedDomain)) {
      return NextResponse.json({
        success: false,
        error: 'This case does not currently map to a supported grounded legal workflow.',
      }, { status: 422 });
    }

    const resolvedDomain = normalizedDomain === 'RTI' ? 'RTI' : 'Consumer';
    const fields = { ...extractedFields, ...extracted_fields };
    const caseContext = `${narrative}\n\nKnown facts:\n${JSON.stringify(fields)}\n\nUser answers:\n${JSON.stringify(answers)}`;

    let retrievedChunks = [];
    try {
      retrievedChunks = await retrieve(caseContext, resolvedDomain, 6, 0.45);
    } catch (ragError) {
      console.warn('[Draft API] RAG retrieval unavailable:', ragError.message);
    }

    const result = await buildDraft({
      domain: resolvedDomain,
      fields,
      retrievedChunks,
      narrative: String(narrative || '').trim(),
      answers,
      language,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: `doc_${Date.now()}`,
        domain: resolvedDomain === 'Consumer' ? 'Consumer Protection' : 'RTI',
        title: result.title || (resolvedDomain === 'RTI' ? 'RTI Application' : 'Consumer Complaint'),
        authorityRecipient: result.authority_recipient || result.authorityRecipient || 'Competent Authority',
        sections: result.sections || [
          { heading: 'AI-Generated Draft', content: result.document_text || '' },
        ],
        citations: result.citations || [],
        draft: result.document_text || '',
        explanation_text: result.explanation_text || '',
        missing_information: result.missing_information || [],
        grounded: result.grounded === true,
        grounding_summary: result.grounding_summary || null,
        ai_generated: true,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Draft API]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate legal document' },
      { status: 500 }
    );
  }
}
