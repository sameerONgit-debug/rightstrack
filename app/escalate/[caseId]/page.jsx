'use client';

import Link from 'next/link';
import CitationBadge from '../../../components/CitationBadge';

export default function EscalatePage({ params }) {
  const { caseId } = params;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-xl bg-red-50 border border-red-200 p-4">
        <div className="flex items-center gap-2 text-red-800 text-sm font-bold">
          <span className="h-2 w-2 rounded-full bg-red-600"></span>
          <span>Automatic Escalation Triggered — Deemed Refusal under Section 7(2)</span>
        </div>
        <p className="mt-1 text-xs text-red-700">
          The 30-day statutory response period elapsed on August 14, 2026 without receipt of information. RightsTrack has automatically pre-drafted your First Appeal Memorandum under Section 19(1) of the RTI Act 2005.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Memorandum of First Appeal</h1>
          <p className="text-xs text-slate-500 font-mono">Case #{caseId} • Escalation #ESC-9012</p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 transition"
        >
          Confirm & Track Appeal →
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4 font-serif text-slate-800 text-sm leading-relaxed">
        <div className="text-center font-sans font-bold text-slate-900 border-b border-slate-200 pb-4">
          FORM B — FIRST APPEAL UNDER SECTION 19(1) OF THE RTI ACT, 2005
        </div>

        <div className="space-y-1 font-sans text-xs text-slate-600">
          <p><strong>To:</strong> The First Appellate Authority (FAA)</p>
          <p>Office of the Registrar / Appellate Authority, University of Delhi, Delhi - 110007</p>
        </div>

        <div className="pt-2">
          <strong>1. Name of Appellant:</strong> Aarav Sharma
        </div>

        <div className="pt-2 space-y-3">
          <strong>2. Grounds for Appeal:</strong>
          <p>
            The appellant submitted an application under{' '}
            <CitationBadge citationKey="RTI-SEC-6(1)" section="Section 6(1)" statute="RTI Act 2005" /> on July 15, 2026.
          </p>
          <p>
            As per{' '}
            <CitationBadge citationKey="RTI-SEC-7(1)" section="Section 7(1)" statute="RTI Act 2005" />, the Public Information Officer was statutorily mandated to supply the information within 30 days. No communication or response was provided within the prescribed period.
          </p>
          <p>
            Pursuant to Section 7(2), the failure to provide information within the statutory window constitutes a <strong>deemed refusal</strong>. Therefore, this First Appeal is preferred under{' '}
            <CitationBadge citationKey="RTI-SEC-19(1)" section="Section 19(1)" statute="RTI Act 2005" /> praying for an order directing immediate supply of duplicate degree certificate records without further fees.
          </p>
        </div>
      </div>
    </div>
  );
}
