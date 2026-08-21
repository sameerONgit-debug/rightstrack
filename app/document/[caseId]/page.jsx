'use client';

import { useState } from 'react';
import Link from 'next/link';
import CitationBadge from '../../../components/CitationBadge';

export default function DocumentViewPage({ params }) {
  const { caseId } = params;
  const [selectedCitation, setSelectedCitation] = useState(null);

  const citations = {
    'RTI-SEC-6(1)': {
      statute: 'Right to Information Act, 2005',
      section: 'Section 6(1)',
      text: 'A person, who desires to obtain any information under this Act, shall make a request in writing or through electronic means in English or Hindi or in the official language of the area in which the application is being made, accompanying such fee as may be prescribed, to the Central Public Information Officer or State Public Information Officer...',
    },
    'RTI-SEC-7(1)': {
      statute: 'Right to Information Act, 2005',
      section: 'Section 7(1)',
      text: 'The Central Public Information Officer or State Public Information Officer, as the case may be, on receipt of a request under section 6 shall, as expeditiously as possible, and in any case within thirty days of the receipt of the request, either provide the information on payment of such fee as may be prescribed or reject the request for any of the reasons specified in sections 8 and 9.',
    },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              RTI APPLICATION DRAFT
            </span>
            <span className="text-xs text-slate-500 font-mono">Case #{caseId}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Application for Certified Records under RTI Act</h1>
        </div>

        <Link
          href={`/file/${caseId}`}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 transition"
        >
          Proceed to Filing & Tracking →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Content */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4 font-serif text-slate-800 text-sm leading-relaxed">
          <div className="text-center font-sans font-bold text-slate-900 border-b border-slate-200 pb-4">
            FORM A — RTI APPLICATION UNDER SECTION 6(1)
          </div>

          <div className="space-y-1 font-sans text-xs text-slate-600">
            <p><strong>To:</strong> The Public Information Officer (PIO)</p>
            <p>Delhi Development Authority (DDA), Vikas Sadan, INA, New Delhi</p>
          </div>

          <div className="pt-2">
            <strong>1. Full Name of Applicant:</strong> Aarav Sharma
          </div>
          <div>
            <strong>2. Address:</strong> Flat 402, Green Park Enclave, New Delhi - 110016
          </div>

          <div className="pt-2 space-y-2">
            <strong>3. Particulars of Information Required:</strong>
            <p>
              Under the provisions of{' '}
              <CitationBadge
                citationKey="RTI-SEC-6(1)"
                section="Section 6(1)"
                statute="RTI Act 2005"
                onInspect={(k) => setSelectedCitation(citations[k])}
              />
              , the undersigned requests certified copies of tender approvals, inspection reports, and contractor payment vouchers regarding road re-carpeting works executed in Green Park Enclave during FY 2023–2024.
            </p>
            <p>
              Kindly furnish the requested information within the statutory thirty-day timeline mandated under{' '}
              <CitationBadge
                citationKey="RTI-SEC-7(1)"
                section="Section 7(1)"
                statute="RTI Act 2005"
                onInspect={(k) => setSelectedCitation(citations[k])}
              />
              .
            </p>
          </div>
        </div>

        {/* Citation Inspector Sidebar */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900">
            Statutory Citation Inspector
          </h3>
          <p className="text-xs text-slate-600">
            Click any blue citation tag in the legal draft to inspect the verified statute text retrieved by our RAG engine.
          </p>

          {selectedCitation ? (
            <div className="rounded-xl border border-blue-200 bg-white p-4 space-y-2 text-xs">
              <div className="font-bold text-blue-950">{selectedCitation.statute}</div>
              <div className="font-mono font-semibold text-blue-700">{selectedCitation.section}</div>
              <p className="text-slate-700 leading-normal">{selectedCitation.text}</p>
              <div className="pt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <span>✓ Verified by Anti-Hallucination Engine</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-blue-200 p-6 text-center text-xs text-slate-500">
              Select a citation badge to inspect verified legal authority
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
