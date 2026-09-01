import { draftsmanAgent } from '@/lib/agents/draftsmanAgent';
import { ragAgent } from '@/lib/agents/ragAgent';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { analysis, answers, language } = await request.json();
    
    if (!analysis || !answers) {
      return Response.json(
        { error: { code: 'INVALID_INPUT', message: 'Analysis and answers are required.' } },
        { status: 400 }
      );
    }

    const supportedLanguages = new Set(['en', 'hi', 'mr', 'bn', 'ta']);
    const lang = supportedLanguages.has(language) ? language : 'en';

    const document = await draftsmanAgent.generateDocument(
      analysis.domain,
      {
        ...analysis.extractedFields,
        ...answers,
      },
      lang
    );

    if (document.status === 'error') {
      return Response.json(
        {
          error: {
            code: 'DOCUMENT_GENERATION_FAILED',
            message: document.error,
          },
        },
        { status: 500 }
      );
    }

    const citedDocument = await draftsmanAgent.addCitationsToDocument(
      document.documentId,
      document.content,
      analysis.domain,
      document.sections || []
    );

    const validation = draftsmanAgent.validateDocumentCompleteness(
      { ...document, ...citedDocument },
      analysis.domain
    );

    const caseId = uuidv4();
    const now = new Date().toISOString();

    const caseRecord = {
      id: caseId,
      domain: analysis.domain,
      user_id: '[[USER_ID]]',
      status: validation.valid ? 'draft_ready' : 'draft_incomplete',
      intake_data: analysis,
      user_responses: answers,
      document_id: document.documentId,
      language: lang,
      created_at: now,
      updated_at: now,
    };

    const { error: caseError } = await supabase
      .from('cases')
      .upsert([caseRecord], { onConflict: 'id' });

    if (caseError) {
      console.warn('Error saving case to database:', caseError);
    }

    const { error: docError } = await supabase
      .from('case_documents')
      .insert([{
        id: document.documentId,
        case_id: caseId,
        document_type: document.documentType,
        domain: analysis.domain,
        content: document.content,
        status: 'draft',
        version: 1,
        citations: document.sections,
        created_at: now,
      }]);

    if (docError) {
      console.warn('Error saving document to database:', docError);
    }

    const response = {
      caseId,
      documentId: document.documentId,
      timestamp: now,
      language: lang,
      document: {
        title: document.documentTitle,
        type: document.documentType,
        status: document.status,
        version: document.version,
        content: citedDocument.contentWithCitations || document.content,
      },
      sections: (document.sections || []).map(section => ({
        name: section.sectionName,
        preview: section.content.substring(0, 200),
        citations: section.citations || [],
      })),
      citations: {
        count: citedDocument.citationsAdded || 0,
        quality: citedDocument.citationQuality || 'adequate',
        statutoryReferences: document.sections || [],
      },
      validation: {
        valid: validation.valid,
        readinessScore: validation.readinessScore,
        errors: validation.errors,
        warnings: validation.warnings,
        nextSteps: validation.valid
          ? ['Review document', 'Fill in placeholder values', 'File with appropriate authority']
          : ['Complete missing sections', 'Provide clarification answers', 'Regenerate document'],
      },
      filingGuidance: {
        authority: '[[APPROPRIATE_AUTHORITY]]',
        estimatedFilingDate: document.estimatedFilingDate,
        requiredAttachments: document.requiredAttachments || [],
        cautions: document.warningsAndCautions || [],
      },
      languageInfo: {
        contentLanguage: lang,
        legalTermsLanguage: 'English',
        supportedLanguages: ['en', 'hi', 'mr', 'bn', 'ta'],
      },
      placeholders: Array.from(new Set(
        (citedDocument.contentWithCitations || document.content || '')
          .match(/\[\[.*?\]\]/g) || []
      )),
    };

    return Response.json(response);

  } catch (error) {
    console.error('POST /api/cases error:', error);
    return Response.json(
      {
        error: {
          code: 'CASE_GENERATION_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const domain = searchParams.get('domain');
    const status = searchParams.get('status');

    let query = supabase.from('cases').select('*');

    if (caseId) query = query.eq('id', caseId);
    if (domain) query = query.eq('domain', domain);
    if (status) query = query.eq('status', status);

    const { data, error } = await query.limit(50);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ cases: data || [] });

  } catch (error) {
    console.error('GET /api/cases error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
