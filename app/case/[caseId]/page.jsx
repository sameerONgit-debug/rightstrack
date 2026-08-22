'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CaseTimeline from '@/components/CaseTimeline';

export default function CaseDetailPage({ params }) {
  const router = useRouter();
  const caseId = params?.caseId || 'case_rti_001';
  const isOverdue = caseId === 'case_rti_002'; // Pre-seeded overdue case for Scenario 1 demo

  const handleEscalate = () => {
    router.push(`/escalate/${caseId}`);
  };

  return (
    <div className="min-h-screen bg-[#EDE6DA] font-sans text-on-surface flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-surface border-b border-outline-variant/20 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <span className="font-serif text-2xl text-primary font-bold tracking-tight">RightsTrack</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-primary hover:text-secondary px-3 py-1.5 rounded-lg border border-secondary/30 transition-all"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Case Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isOverdue ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-secondary-container/60 text-primary'
            }`}>
              {isOverdue ? 'Response Overdue — Escalate Now' : 'Tracked & Active'}
            </span>
            <span className="text-xs font-mono text-on-surface-variant">ID: {caseId}</span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary">
            {isOverdue ? 'PM-KISAN Pending Installment - Overdue Appeal' : 'PM-KISAN Farmer Subsidy Non-Payment Inquiry'}
          </h1>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Timeline (8 Cols) */}
          <div className="lg:col-span-8 bg-surface rounded-2xl p-6 md:p-8 shadow-xs border border-outline-variant/30">
            <h2 className="font-serif text-2xl font-bold text-primary mb-6">Case Timeline</h2>
            <CaseTimeline caseId={caseId} isOverdue={isOverdue} />
          </div>

          {/* Sidebar Actions & Details (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Actions Card */}
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
              <h3 className="font-serif text-xl font-bold text-primary">Actions</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isOverdue
                  ? 'The mandatory 30-day statutory response deadline has elapsed with no reply from the Public Information Officer.'
                  : 'Expedited appeal filing becomes available automatically if the 30-day statutory deadline passes without a reply.'}
              </p>

              <button
                onClick={handleEscalate}
                disabled={!isOverdue}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  isOverdue
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm cursor-pointer'
                    : 'bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed border border-outline-variant/20'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">gavel</span>
                <span>{isOverdue ? 'Auto-Draft Appeal Now' : 'Escalate (Locked)'}</span>
              </button>

              {!isOverdue && (
                <p className="text-[11px] text-center text-on-surface-variant">
                  Escalation unlocks automatically after Sep 11, 2026
                </p>
              )}
            </div>

            {/* Summary Details Card */}
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-3">
              <h3 className="font-serif text-xl font-bold text-primary mb-4">Case Metadata</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-outline-variant/20 pb-2">
                  <span className="text-on-surface-variant">Domain</span>
                  <span className="font-semibold text-primary">RTI (Right to Information)</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/20 pb-2">
                  <span className="text-on-surface-variant">Target Authority</span>
                  <span className="font-semibold text-primary">Block Development Office</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/20 pb-2">
                  <span className="text-on-surface-variant">Statutory Limit</span>
                  <span className="font-semibold text-primary">30 Calendar Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Grounding Status</span>
                  <span className="font-semibold text-secondary">Verified ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-outline-variant/20 bg-surface-container-low mt-8">
        <div className="max-w-6xl mx-auto px-6 text-xs text-on-surface-variant">
          © 2026 RightsTrack. Legal & Civic Transparency Platform.
        </div>
      </footer>
    </div>
  );
}
