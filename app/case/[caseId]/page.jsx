'use client';

import Link from 'next/link';
import DeadlineTimer from '../../../components/DeadlineTimer';

export default function CaseDetailsPage({ params }) {
  const { caseId } = params;
  const isOverdue = caseId.includes('4091');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
              RTI ACT, 2005
            </span>
            <span className="text-xs text-slate-500 font-mono">Case #{caseId}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {isOverdue
              ? 'Delhi University Duplicate Degree Certificate Delay'
              : 'DDA Road Re-carpeting Expenditure RTI'}
          </h1>
        </div>

        {isOverdue ? (
          <Link
            href={`/escalate/${caseId}`}
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition"
          >
            Draft First Appeal Now →
          </Link>
        ) : (
          <Link
            href={`/document/${caseId}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            View Original Document
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <DeadlineTimer
            daysRemaining={isOverdue ? 0 : 13}
            deadlineDate={isOverdue ? '2026-08-14' : '2026-09-04'}
            isBreached={isOverdue}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Case Timeline & Status History</h3>
            <ol className="relative border-l border-slate-200 ml-3 space-y-6">
              <li className="ml-6">
                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  ✓
                </span>
                <h4 className="text-sm font-semibold text-slate-900">Application Filed with PIO</h4>
                <p className="text-xs text-slate-500">
                  {isOverdue ? 'July 15, 2026' : 'August 5, 2026'} • Acknowledgement #DDA/RTI/2026/0912
                </p>
              </li>
              <li className="ml-6">
                <span
                  className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ${
                    isOverdue ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  } text-xs font-bold`}
                >
                  {isOverdue ? '!' : '⋯'}
                </span>
                <h4 className="text-sm font-semibold text-slate-900">
                  {isOverdue
                    ? '30-Day Response Window Expired (Deemed Refusal)'
                    : 'Awaiting Statutory Response from PIO'}
                </h4>
                <p className="text-xs text-slate-500">
                  {isOverdue
                    ? 'Deadline breached under Section 7(2). First Appeal eligible under Section 19(1).'
                    : '13 days remaining in statutory response window.'}
                </p>
              </li>
            </ol>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Case Metadata</h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block">Public Authority:</span>
              <span className="font-semibold text-slate-800">
                {isOverdue ? 'University of Delhi (Exam Branch)' : 'Delhi Development Authority'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Applicant:</span>
              <span className="font-semibold text-slate-800">Aarav Sharma</span>
            </div>
            <div>
              <span className="text-slate-500 block">Statute:</span>
              <span className="font-semibold text-slate-800">Right to Information Act, 2005</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
