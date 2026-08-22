'use client';

import Link from 'next/link';

export default function CaseCard({ caseItem }) {
  const { id, domain, status, deadline_date, days_remaining, title } = caseItem;

  const isOverdue = status === 'overdue' || (days_remaining !== null && days_remaining <= 0);

  return (
    <div className={`bg-surface rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between ${
      isOverdue ? 'border-red-300 ring-1 ring-red-500/20' : 'border-outline-variant/30 hover:border-primary/40'
    }`}>
      {isOverdue && <div className="absolute top-0 right-0 w-2 h-full bg-red-600"></div>}

      <div>
        {/* Top Header / Badges */}
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="w-10 h-10 rounded-xl bg-secondary-container text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">
              {domain === 'RTI' ? 'policy' : 'shopping_bag'}
            </span>
          </div>

          {isOverdue ? (
            <Link
              href={`/escalate/${id}`}
              className="bg-red-100 text-red-700 font-semibold text-xs px-3 py-1.5 rounded-full border border-red-300 flex items-center gap-1.5 hover:bg-red-600 hover:text-white transition-all shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              <span>Escalate Now</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          ) : (
            <span className="bg-surface-variant text-on-surface-variant font-medium text-xs px-3 py-1 rounded-full border border-outline-variant/30">
              {status === 'filed' ? 'Tracked & Filed' : 'Draft'}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg font-bold text-primary mb-2 line-clamp-2">{title}</h3>
        <p className="font-sans text-xs text-on-surface-variant mb-4">
          Category: <span className="font-semibold text-primary">{domain}</span>
        </p>

        {/* Countdown Ring or Days Remaining */}
        {!isOverdue && days_remaining !== null && (
          <div className="mb-4 flex items-center gap-3 bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20">
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
              <span className="font-bold text-xs text-primary">{days_remaining}d</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-primary">{days_remaining} days remaining</span>
              <span className="text-[11px] text-on-surface-variant">Statutory 30-day response window</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer link */}
      <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center mt-2">
        <span className="text-xs text-on-surface-variant font-mono">ID: {id}</span>
        <Link
          href={`/case/${id}`}
          className="text-xs font-semibold text-primary hover:text-secondary flex items-center gap-1 transition-colors"
        >
          <span>View Timeline</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
