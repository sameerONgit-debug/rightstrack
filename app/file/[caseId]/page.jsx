'use client';

import Link from 'next/link';

export default function FileCasePage({ params }) {
  const { caseId } = params;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Step 4: Confirm Filing & Start Tracker</h1>
        <p className="mt-2 text-slate-600">
          Once you have submitted your RTI application or Consumer complaint online or via registered speed post, record your filing date to activate real-time statutory deadline tracking.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Filing / Submission Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              defaultValue="2026-08-22"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Acknowledgement / Postal Tracking / Online Reference Number
            </label>
            <input
              type="text"
              placeholder="e.g. DDA/RTI/2026/0912 or Speed Post ED92819281IN"
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              defaultValue="DDA/RTI/2026/0912"
            />
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 space-y-1">
            <p className="font-bold">Statutory Deadline Engine Activated:</p>
            <p>
              Under RTI Act 2005 Section 7(1), the PIO has exactly <strong>30 calendar days</strong> to furnish records. If no response is received by the deadline, RightsTrack will automatically generate a First Appeal under Section 19(1).
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Link href={`/document/${caseId}`} className="text-sm font-medium text-slate-500 hover:text-slate-700">
            ← Back to Document
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            Activate Case Tracker →
          </Link>
        </div>
      </div>
    </div>
  );
}
