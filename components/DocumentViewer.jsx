'use client';

import { useState } from 'react';
import CitationChip from './CitationChip';

export default function DocumentViewer({ caseId, domain = 'RTI', grounded = true, onProceedToFile }) {
  const [selectedCitation, setSelectedCitation] = useState(null);

  const isRTI = domain === 'RTI';

  const citations = isRTI
    ? [
        {
          id: 1,
          actName: 'Right to Information Act, 2005',
          section: 'Section 6(1)',
          excerpt: 'A person who desires to obtain any information under this Act shall make a request in writing or through electronic means in English or Hindi or in the official language of the area...',
          verifiedDate: 'Aug 2026',
        },
        {
          id: 2,
          actName: 'Right to Information Act, 2005',
          section: 'Section 7(1)',
          excerpt: 'The Central Public Information Officer or State Public Information Officer shall as expeditiously as possible, and in any case within thirty days of the receipt of the request, either provide the information...',
          verifiedDate: 'Aug 2026',
        },
      ]
    : [
        {
          id: 1,
          actName: 'Consumer Protection Act, 2019',
          section: 'Section 2(7) & Section 35',
          excerpt: 'A consumer may file a complaint before the District Commission in relation to any goods sold or delivered or agreed to be sold or delivered which suffer from one or more defects...',
          verifiedDate: 'Aug 2026',
        },
        {
          id: 2,
          actName: 'Consumer Protection Act, 2019',
          section: 'Section 2(11)',
          excerpt: '"Defect" means any fault, imperfection or shortcoming in the quality, quantity, potency, purity or standard which is required to be maintained by or under any law for the time being in force...',
          verifiedDate: 'Aug 2026',
        },
      ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
      {/* Left Column: Document Canvas (60%) */}
      <section className="lg:col-span-7 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {grounded ? (
              <span className="inline-flex items-center bg-secondary-container text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px] mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                Grounded ✓
              </span>
            ) : (
              <span className="inline-flex items-center bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-semibold">
                General guidance — not matched to a specific provision
              </span>
            )}
            <span className="text-on-surface-variant text-xs font-mono">Case ID: {caseId}</span>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Print
          </button>
        </div>

        {/* Document Card */}
        <article className="bg-surface rounded-2xl shadow-[0_4px_25px_rgba(27,67,50,0.08)] p-6 md:p-8 relative border border-outline-variant/30 text-on-surface leading-relaxed text-sm md:text-base space-y-6">
          <div className="border-b border-outline-variant/20 pb-4">
            <h2 className="font-serif text-2xl font-bold text-primary">
              {isRTI
                ? 'Application for Information under Section 6(1) of the RTI Act, 2005'
                : 'Consumer Complaint before the District Consumer Disputes Redressal Commission'}
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">To: Public Information Officer / District Commission</p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-lg text-primary mb-2">1. Applicant Details & Subject Matter</h3>
            <p>
              The Applicant hereby submits this application seeking official disclosure and resolution regarding non-disbursement of entitlement benefits under statutory provisions{' '}
              <CitationChip index={1} isSelected={selectedCitation === 1} onClick={() => setSelectedCitation(selectedCitation === 1 ? null : 1)} />.
            </p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-lg text-primary mb-2">2. Statement of Facts</h3>
            <p>
              {isRTI
                ? 'The applicant is a registered beneficiary of the PM-KISAN scheme. Despite multiple inquiries at the Block Development Office, the quarterly installment payments have been withheld for 3 consecutive months without written explanation.'
                : 'The complainant purchased a Pressure Cooker for ₹2,400 online. Upon delivery, the product lid was cracked and defective. The seller has explicitly refused to process a refund or replacement.'}
              {' '}
              <CitationChip index={2} isSelected={selectedCitation === 2} onClick={() => setSelectedCitation(selectedCitation === 2 ? null : 2)} />.
            </p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-lg text-primary mb-2">3. Relief & Mandatory Statutory Response</h3>
            <p>
              {isRTI
                ? 'Information requested must be provided within the mandatory 30-day period as stipulated under statutory law.'
                : 'The complainant seeks full refund of ₹2,400 along with appropriate compensation for defective goods and service deficiency.'}
            </p>
          </div>

          {/* Footer date tag */}
          <div className="pt-4 border-t border-outline-variant/20 text-xs text-on-surface-variant flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">history</span>
              Legal text aligned with statutes as of Aug 2026 — verify before filing
            </span>
          </div>
        </article>

        {/* Action Button */}
        {onProceedToFile && (
          <div className="flex justify-end pt-2">
            <button
              onClick={onProceedToFile}
              className="bg-primary text-on-primary font-semibold text-sm px-8 py-3.5 rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center gap-2"
            >
              <span>Proceed to Filing Instructions</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        )}
      </section>

      {/* Right Column: Sources Panel (40%) */}
      <section className="lg:col-span-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">library_books</span>
            Statutory Sources
          </h3>
          <span className="bg-surface-variant text-on-surface-variant px-2.5 py-1 rounded-full text-xs font-medium">
            {citations.length} References
          </span>
        </div>

        <div className="space-y-4">
          {citations.map((cite) => (
            <div
              key={cite.id}
              onClick={() => setSelectedCitation(cite.id)}
              className={`bg-surface border rounded-xl p-5 shadow-xs transition-all cursor-pointer ${
                selectedCitation === cite.id
                  ? 'border-primary ring-2 ring-primary/20 bg-secondary-container/10'
                  : 'border-outline-variant/30 hover:border-primary/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-secondary-container text-primary rounded-full text-xs font-bold mt-0.5">
                  {cite.id}
                </span>
                <div className="space-y-2 text-left">
                  <h4 className="font-semibold text-sm text-primary leading-tight">{cite.actName}</h4>
                  <p className="text-xs font-medium text-secondary">{cite.section}</p>
                  <blockquote className="bg-surface-container-low p-3 rounded-lg border-l-2 border-secondary text-xs text-on-surface leading-relaxed italic">
                    "{cite.excerpt}"
                  </blockquote>
                  <div className="flex items-center gap-1.5 text-[11px] text-outline font-medium">
                    <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
                    Verified: {cite.verifiedDate}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
