import { NextResponse } from 'next/server';

/**
 * GET /api/sources/:documentId
 * Fetches verified statutory source passages, chunks, and section texts backing a document's citations.
 */
export async function GET(request, { params }) {
  const { documentId } = params;

  const sources = [
    {
      citation_key: 'RTI-SEC-6(1)',
      statute: 'Right to Information Act, 2005',
      section: 'Section 6(1)',
      chunk_id: 'rti-sec-6-1-p1',
      text: 'A person, who desires to obtain any information under this Act, shall make a request in writing or through electronic means...',
      source_authority: 'Ministry of Law and Justice, Govt of India',
    },
    {
      citation_key: 'RTI-SEC-7(1)',
      statute: 'Right to Information Act, 2005',
      section: 'Section 7(1)',
      chunk_id: 'rti-sec-7-1-p1',
      text: 'The Central Public Information Officer or State Public Information Officer, as the case may be, on receipt of a request under section 6 shall, as expeditiously as possible, and in any case within thirty days of the receipt of the request...',
      source_authority: 'Ministry of Law and Justice, Govt of India',
    },
  ];

  return NextResponse.json({ success: true, data: { document_id: documentId, sources }, error: null });
}
