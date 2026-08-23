import { NextResponse } from 'next/server';

/**
 * POST /api/analyze
 * Classifies citizen narrative into RTI or Consumer domain, extracts entities, and generates clarifying questions.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { narrative } = body;

    if (!narrative || narrative.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'INVALID_INPUT', message: 'Problem narrative is required.' },
        },
        { status: 400 }
      );
    }

    // Mock analysis pipeline stub conforming to docs/mvp-spec.md contract
    const isConsumer = /refund|seller|order|warranty|delivery|bought|product|amazon|flipkart/i.test(narrative);

    const result = {
      domain: isConsumer ? 'CONSUMER' : 'RTI',
      confidence: 0.94,
      rationale: isConsumer
        ? 'Problem describes a transaction for goods or services with deficiency/unfair trade practice under Consumer Protection Act 2019.'
        : 'Problem relates to government public works, municipal operations, or official records under Right to Information Act 2005.',
      entities: {
        applicant_name: null,
        target_entity: isConsumer ? 'Online Merchant / Service Provider' : 'Public Authority / Municipal Office',
        relief_sought: isConsumer ? 'Replacement or full refund with compensation' : 'Certified copies of official records',
      },
      clarifications: [
        {
          id: 'authority_name',
          question: isConsumer ? 'What is the company name or merchant name?' : 'Which specific public department or municipal authority is responsible?',
          required: true,
        },
        {
          id: 'reference_id',
          question: isConsumer ? 'What is your invoice or order number?' : 'Do you have an application or tender reference number?',
          required: false,
        },
      ],
    };

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: 'ANALYSIS_ERROR', message: error.message },
      },
      { status: 500 }
    );
  }
}
