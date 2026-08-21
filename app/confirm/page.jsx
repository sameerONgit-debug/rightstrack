'use client';

import Link from 'next/link';

export default function ConfirmPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Step 2: Confirm Classification</h1>
        <p className="mt-2 text-slate-600">
          Our legal classifier evaluated your narrative against applicable Indian statutory domains.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 uppercase">
            Recommended Domain
          </span>
          <span className="text-xs font-mono text-slate-500">Confidence: 96%</span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">Right to Information (RTI) Act, 2005</h2>
          <p className="mt-2 text-sm text-slate-600">
            Your grievance involves a request for government documents and administrative records from a public authority.
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Statutory Rights Activated:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Section 6(1): Right to request certified records and project accounts</li>
            <li>Section 7(1): 30-day mandatory response limit for Public Information Officer</li>
            <li>Section 19(1): Right to First Appeal upon deemed refusal or non-reply</li>
          </ul>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Link href="/intake" className="text-sm font-medium text-slate-500 hover:text-slate-700">
            ← Re-enter narrative
          </Link>
          <Link
            href="/questions"
            className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            Confirm & Answer Clarifications →
          </Link>
        </div>
      </div>
    </div>
  );
}
