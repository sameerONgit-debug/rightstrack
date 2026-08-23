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
      suggested_category = '',
      narrative = '',
      extracted_fields = {},
      extractedFields = {},
      answers = {},
      language = 'en',
    } = body;

    const normalizedDomain = String(domain || '').toUpperCase();
    const resolvedDomain = normalizedDomain === 'RTI'
      ? 'RTI'
      : ['CONSUMER', 'CONSUMER PROTECTION'].includes(normalizedDomain)
        ? 'Consumer'
        : 'Unsupported';

    if (!String(narrative || '').trim()) {
      return NextResponse.json({ success: false, error: 'The original grievance narrative is required.' }, { status: 400 });
    }

    const fields = { ...extractedFields, ...extracted_fields };
    const caseContext = `${narrative}\n\nAI category: ${suggested_category}\n\nKnown facts:\n${JSON.stringify(fields)}\n\nUser answers:\n${JSON.stringify(answers)}`;

    // The existing statutory RAG corpus is domain-specific. Do not feed an
    // unrelated grievance into an RTI/Consumer corpus just to manufacture a citation.
    let retrievedChunks = [];
    if (resolvedDomain === 'RTI' || resolvedDomain === 'Consumer') {
      try {
        retrievedChunks = await retrieve(caseContext, resolvedDomain, 6, 0.45);
      } catch (ragError) {
        console.warn('[Draft API] RAG retrieval unavailable:', ragError.message);
      }
    }

    const result = await buildDraft({
      domain: resolvedDomain,
      fields,
      retrievedChunks,
      narrative: String(narrative).trim(),
      answers,
      language,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: `doc_${Date.now()}`,
        domain: resolvedDomain === 'Consumer' ? 'Consumer Protection' : resolvedDomain === 'RTI' ? 'RTI' : 'Other / AI-identified matter',
        suggested_category,
        title: result.title || 'Personalized Legal & Civic Guidance',
        authorityRecipient: result.authority_recipient || result.authorityRecipient || 'Authority to be confirmed from jurisdiction',
        sections: result.sections || [{ heading: 'AI-Generated Draft', content: result.document_text || '' }],
        citations: result.citations || [],
        draft: result.document_text || '',
        explanation_text: result.explanation_text || '',
        missing_information: result.missing_information || [],
        guidance: result.guidance || null,
        grounded: result.grounded === true,
        grounding_summary: result.grounding_summary || null,
        ai_generated: true,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Draft API]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate the case guidance and document.' },
      { status: 500 }
    );
  }
}
