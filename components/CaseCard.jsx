import Link from 'next/link';

export default function CaseCard({ caseItem }) {
  const { id, title, domain, status, filing_date, deadline_days_remaining, is_breached } = caseItem;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
          {domain === 'RTI' ? 'RTI Act 2005' : 'Consumer Protection Act'}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            is_breached
              ? 'bg-red-100 text-red-800'
              : status === 'FILED'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {is_breached ? 'DEADLINE BREACHED' : status}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-bold text-slate-900 line-clamp-1">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 font-mono">ID: {id}</p>

      <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between text-sm">
        <div>
          <span className="text-xs text-slate-500">Filed: </span>
          <span className="font-medium text-slate-700">
            {filing_date ? new Date(filing_date).toLocaleDateString() : 'Not filed yet'}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500">Time Left: </span>
          <span className={`font-bold ${is_breached ? 'text-red-600' : 'text-slate-800'}`}>
            {is_breached ? '0 Days (Overdue)' : `${deadline_days_remaining ?? 30} Days`}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/case/${id}`}
          className="flex-1 text-center rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
        >
          View Case & Timeline
        </Link>
        {is_breached && (
          <Link
            href={`/escalate/${id}`}
            className="flex-1 text-center rounded-lg bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-700 transition"
          >
            Escalate Appeal
          </Link>
        )}
      </div>
    </div>
  );
}
