'use client';

/**
 * DeadlineTimer — Real-time statutory countdown timer computed deterministically.
 */
export default function DeadlineTimer({ daysRemaining, deadlineDate, isBreached }) {
  if (isBreached) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-red-800">
        <div className="h-3 w-3 rounded-full bg-red-600 animate-ping"></div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-red-600">Statutory Deadline Breached</div>
          <div className="text-sm font-semibold">Deemed Refusal Triggered — First Appeal Ready</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-900">
      <div className="text-2xl font-black text-amber-700">{daysRemaining}</div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">Days Remaining</div>
        <div className="text-xs text-slate-600">
          Response due by {deadlineDate ? new Date(deadlineDate).toLocaleDateString() : 'N/A'}
        </div>
      </div>
    </div>
  );
}
