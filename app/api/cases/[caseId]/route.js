import { NextResponse } from 'next/server';

/**
 * GET /api/cases/:caseId — Retrieves case details
 * PATCH /api/cases/:caseId — Updates case status (filing date, resolution, etc.)
 */
export async function GET(request, { params }) {
  const { caseId } = params;

  const caseData = {
    case_id: caseId,
    domain: 'RTI',
    title: 'Delhi Development Authority Road Expenditure RTI',
    status: 'FILED',
    filing_date: '2026-08-05T00:00:00.000Z',
    deadline_date: '2026-09-04T23:59:59.000Z',
    days_remaining: 13,
    is_breached: false,
    history: [
      { action: 'CREATED', timestamp: '2026-08-05T00:00:00.000Z' },
      { action: 'FILED', timestamp: '2026-08-05T12:30:00.000Z', ref: 'DDA/RTI/2026/0912' },
    ],
  };

  return NextResponse.json({ success: true, data: caseData, error: null });
}

export async function PATCH(request, { params }) {
  try {
    const { caseId } = params;
    const body = await request.json();

    return NextResponse.json({
      success: true,
      data: {
        case_id: caseId,
        updated_fields: body,
        updated_at: new Date().toISOString(),
      },
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, data: null, error: { code: 'UPDATE_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
