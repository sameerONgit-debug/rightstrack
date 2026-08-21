'use client';

import Link from 'next/link';

export default function QuestionsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Step 3: Clarifying Details</h1>
        <p className="mt-2 text-slate-600">
          Answer a few deterministic questions to ensure your legal draft contains all mandatory statutory particulars.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Public Authority Name / Department <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Municipal Corporation of Greater Mumbai / PWD"
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              defaultValue="Delhi Development Authority"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Applicant Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Full name as per official ID"
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              defaultValue="Aarav Sharma"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Postal Address for Reply Dispatch <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Complete residential address with PIN code"
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              defaultValue="Flat 402, Green Park Enclave, New Delhi - 110016"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Link href="/confirm" className="text-sm font-medium text-slate-500 hover:text-slate-700">
            ← Back
          </Link>
          <Link
            href="/document/demo-case-01"
            className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            Generate Grounded Legal Document →
          </Link>
        </div>
      </div>
    </div>
  );
}
