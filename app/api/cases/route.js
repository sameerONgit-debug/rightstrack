import { NextResponse } from 'next/server';

/**
 * GET /api/cases — Lists all cases for active session
 * POST /api/cases — Creates new case and generates citation-grounded document
 */
export async function GET() {
  const cases = [
    {
      case_id: 'rt-2026-8812',
      domain: 'RTI',
      title: 'DDA Road Re-carpeting Expenditure RTI',
      status: 'FILED',
      filing_date: '2026-08-05T00:00:00.000Z',
      deadline_date: '2026-09-04T23:59:59.000Z',
      days_remaining: 13,
      is_breached: false,
    },
    {
      case_id: 'rt-2026-4091',
      domain: 'RTI',
      title: 'Delhi University Duplicate Degree Certificate Delay',
      status: 'DEADLINE_BREACHED',
      filing_date: '2026-07-15T00:00:00.000Z',
      deadline_date: '2026-08-14T23:59:59.000Z',
      days_remaining: 0,
      is_breached: true,
    },
  ];

  return NextResponse.json({ success: true, data: { cases, total: cases.length }, error: null });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { domain, narrative, entities } = body;

    const caseId = `rt-${Date.now().toString(36)}`;
    const newCase = {
      case_id: caseId,
      status: 'READY_TO_FILE',
      domain: domain || 'RTI',
      title: entities?.title || 'RTI Application — Public Records Request',
      document: {
        id: `doc-${caseId}`,
        type: domain === 'CONSUMER' ? 'CONSUMER_COMPLAINT' : 'RTI_APPLICATION',
        content: `BEFORE THE COMPETENT AUTHORITY...\n\nApplicant: ${entities?.applicant_name || 'Aarav Sharma'}\n\nGrounds: ${narrative}`,
        citations: [
          {
            id: 'RTI-SEC-6-1',
            statute: 'Right to Information Act, 2005',
            section: 'Section 6(1)',
            snippet: 'Request for obtaining information...',
            verified: true,
          },
        ],
      },
      deadline: {
        days_statutory: 30,
        is_life_or_liberty: false,
        status: 'PENDING_FILING',
      },
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: newCase, error: null }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, data: null, error: { code: 'CASE_CREATION_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
