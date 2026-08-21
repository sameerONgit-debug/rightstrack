import { NextResponse } from 'next/server';

/**
 * POST /api/cases/:caseId/escalate
 * Triggered when a statutory response deadline has breached with no reply (deemed refusal).
 */
export async function POST(request, { params }) {
  try {
    const { caseId } = params;

    const escalation = {
      case_id: caseId,
      escalation_id: `esc-${Date.now().toString(36)}`,
      type: 'RTI_FIRST_APPEAL',
      grounds: 'Deemed Refusal under Section 7(2) of RTI Act 2005 due to expiry of 30-day statutory period.',
      appeal_document: {
        id: `doc-esc-${caseId}`,
        title: 'Memorandum of First Appeal under Section 19(1)',
        content: 'BEFORE THE FIRST APPELLATE AUTHORITY...\n\nMemorandum of First Appeal under Section 19(1)...',
        citations: [
          {
            id: 'RTI-SEC-19-1',
            statute: 'Right to Information Act, 2005',
            section: 'Section 19(1)',
            snippet: 'Any person who does not receive a decision within thirty days...',
            verified: true,
          },
        ],
      },
      new_deadline_days: 30,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: escalation, error: null });
  } catch (error) {
    return NextResponse.json(
      { success: false, data: null, error: { code: 'ESCALATION_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
