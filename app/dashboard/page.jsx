'use client';

import Link from 'next/link';
import CaseCard from '../../components/CaseCard';

export default function DashboardPage() {
  const demoCases = [
    {
      id: 'RT-2026-8812',
      title: 'DDA Road Re-carpeting Expenditure RTI',
      domain: 'RTI',
      status: 'FILED',
      filing_date: '2026-08-05T00:00:00.000Z',
      deadline_days_remaining: 13,
      is_breached: false,
    },
    {
      id: 'RT-2026-4091',
      title: 'Delhi University Duplicate Degree Certificate Delay',
      domain: 'RTI',
      status: 'DEADLINE_BREACHED',
      filing_date: '2026-07-15T00:00:00.000Z',
      deadline_days_remaining: 0,
      is_breached: true,
    },
    {
      id: 'CP-2026-1029',
      title: 'Defective Laptop Warranty Replacement Refusal',
      domain: 'CONSUMER',
      status: 'UNDER_REVIEW',
      filing_date: '2026-08-10T00:00:00.000Z',
      deadline_days_remaining: 18,
      is_breached: false,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Active Case Tracker</h1>
          <p className="mt-1 text-slate-600">
            Real-time statutory deadline monitoring for all your active civic and legal actions.
          </p>
        </div>

        <Link
          href="/intake"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 transition"
        >
          + File New Case
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {demoCases.map((caseItem) => (
          <CaseCard key={caseItem.id} caseItem={caseItem} />
        ))}
      </div>
    </div>
  );
}
