'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DisclaimerBanner from '@/components/DisclaimerBanner';

export default function EscalatePage({ params }) {
  const router = useRouter();
  const caseId = params?.caseId || 'case_rti_002';
  const [isFiled, setIsFiled] = useState(false);
  const originalFilingDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
  const filingDateText = originalFilingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const appealDateText = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleMarkFiled = () => {
    setIsFiled(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#EDE6DA] font-sans text-on-surface flex flex-col">
      {/* Top Header Navigation */}
      <header className="bg-surface border-b border-outline-variant/20 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <span className="font-serif text-2xl text-primary font-bold tracking-tight">RightsTrack</span>
          </Link>

          <Link
            href={`/case/${caseId}`}
            className="text-xs font-semibold text-primary hover:text-secondary px-3 py-1.5 rounded-lg border border-secondary/30 transition-all"
          >
            ← Back to Case Timeline
          </Link>
        </div>
      </header>

      {/* Appeal Banner (The Differentiator Header) */}
      <div className="bg-secondary-container/80 text-primary py-4 border-b border-secondary/30 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-red-700 animate-pulse">warning</span>
              <h1 className="font-serif text-2xl font-bold text-primary">Auto-Drafted First Appeal</h1>
            </div>
            <p className="text-xs text-on-secondary-container mt-0.5">
              This appeal directly references original Case <span className="font-mono font-bold">#{caseId}</span>, filed {filingDateText} (30-day limit elapsed).
            </p>
          </div>

          <button
            onClick={handleMarkFiled}
            disabled={isFiled}
            className="bg-primary text-on-primary font-semibold text-xs px-6 py-3 rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2 self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>{isFiled ? 'Appeal Marked as Filed!' : 'Mark Appeal as Filed'}</span>
          </button>
        </div>
      </div>

      {/* Persistent Non-Dismissible Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Appeal Document (8 Cols) */}
        <article className="lg:col-span-8 bg-surface rounded-2xl p-6 md:p-8 shadow-xs border border-outline-variant/30 space-y-6 text-on-surface leading-relaxed text-sm md:text-base">
          <header className="pb-4 border-b border-outline-variant/20">
            <h2 className="font-serif text-2xl font-bold text-primary mb-2">
              FIRST APPEAL UNDER SECTION 19(1) OF THE RIGHT TO INFORMATION ACT, 2005
            </h2>
            <div className="flex items-center gap-4 text-xs text-on-surface-variant font-mono">
              <span>Date: {appealDateText}</span>
              <span>Target: First Appellate Authority (FAA)</span>
            </div>
          </header>

          <div className="space-y-4">
            <p className="font-serif font-bold text-primary">Before the First Appellate Authority,</p>

            <p>
              This first statutory appeal is presented under Section 19(1) of the Right to Information Act, 2005 against the deemed refusal by the Public Information Officer (PIO), Block Development Office.
            </p>

            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 space-y-2 text-xs md:text-sm">
              <h3 className="font-bold text-primary">1. Chronology of Deemed Refusal</h3>
              <p>
                The Appellant submitted an RTI application under Section 6(1) on {filingDateText} seeking details regarding non-disbursement of PM-KISAN subsidy installments. Pursuant to Section 7(1), the mandatory 30-day response window expired without any communication or decision from the PIO.
              </p>
              <span className="inline-flex items-center gap-1 bg-secondary-container text-primary px-2.5 py-0.5 rounded-full text-[11px] font-semibold mt-1">
                <span className="material-symbols-outlined text-[13px]">check_circle</span> Grounded ✓ S.19(1) RTI Act
              </span>
            </div>

            <h3 className="font-serif font-bold text-lg text-primary pt-2">2. Grounds of Appeal & Requested Relief</h3>
            <p>
              As per Section 19(1), failure to provide information within 30 days constitutes a deemed refusal. The Appellant prays that the First Appellate Authority direct the PIO to immediately furnish the requested records free of charge as mandated under Section 7(6) of the Act.
            </p>
          </div>

          <div className="pt-6 border-t border-outline-variant/20 flex justify-between items-end text-xs text-on-surface-variant">
            <div>
              <p className="font-semibold text-primary">Appellant Verification</p>
              <p className="mt-1">Verified & Digitally Signed</p>
            </div>
            <div className="text-right">
              <p className="font-mono">Reference ID: APP-2026-992</p>
            </div>
          </div>
        </article>

        {/* Reference Sidebar (4 Cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface rounded-2xl p-6 shadow-xs border border-outline-variant/30 space-y-4">
            <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              <span className="material-symbols-outlined text-secondary">library_books</span>
              <h3 className="font-serif text-lg font-bold text-primary">Referenced Case Evidence</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <span className="font-bold text-primary block mb-1">Original RTI Application #6(1)</span>
                <p className="text-on-surface-variant">Submitted {filingDateText} to Block Development Office.</p>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <span className="font-bold text-primary block mb-1">Section 19(1) Statutory Provision</span>
                <p className="text-on-surface-variant">Statutory right to appeal upon expiry of 30-day limit without reply.</p>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <span className="font-bold text-primary block mb-1">Section 7(6) Cost Exemption</span>
                <p className="text-on-surface-variant">Information must be provided free of cost if delayed beyond 30 days.</p>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
