'use client';

import Link from 'next/link';

export default function CaseTimeline({ caseId = 'case_rti_001', filedDate = '2026-07-23', isExpired = false }) {
  const originalFilingDate = new Date(`${filedDate}T00:00:00`);
  const filingDateText = originalFilingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const createdDate = new Date(originalFilingDate.getTime() - 24 * 60 * 60 * 1000);
  const createdDateText = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const responseDeadline = new Date(originalFilingDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const deadlineText = responseDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const events = [
    {
      id: 1,
      title: 'Case Created',
      description: 'Initiated by citizen via plain text intake',
      date: createdDateText,
      completed: true,
    },
    {
      id: 2,
      title: 'Application Filed',
      description: 'Submitted to Public Information / Block Development Office',
      date: filingDateText,
      completed: true,
      documentLink: `/document/${caseId}`,
    },
    {
      id: 3,
      title: 'Mandatory 30-Day Response Deadline',
      description: isExpired ? `Deadline elapsed without response on ${deadlineText}` : 'Awaiting statutory response from PIO',
      date: deadlineText,
      completed: isExpired,
      isDeadline: true,
    },
    {
      id: 4,
      title: 'First Appeal / Escalation',
      description: isExpired ? 'Escalation draft auto-generated citing S.19(1)' : 'Pending response deadline expiry',
      date: isExpired ? filingDateText : 'Pending Expiry',
      completed: isExpired,
      isEscalation: true,
    },
  ];

  return (
    <div className="relative pl-6 space-y-8">
      {/* Vertical Connecting Line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-outline-variant/30"></div>

      {events.map((evt) => (
        <div key={evt.id} className="relative z-10 flex gap-4 items-start">
          {/* Timeline Node */}
          <div className="shrink-0 mt-0.5">
            {evt.completed ? (
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check
                </span>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-surface border-2 border-outline-variant/60 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="flex-1 bg-surface p-4 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h3 className={`font-semibold text-sm ${evt.completed ? 'text-primary' : 'text-on-surface-variant'}`}>
                {evt.title}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">{evt.description}</p>
              <span className="text-[11px] font-mono text-outline mt-1 block">{evt.date}</span>
            </div>

            {evt.documentLink && (
              <Link
                href={evt.documentLink}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-secondary transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">description</span>
                View Document
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
