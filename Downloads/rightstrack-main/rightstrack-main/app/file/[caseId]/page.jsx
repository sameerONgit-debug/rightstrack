'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FileCasePage({ params }) {
  const router = useRouter();
  const caseId = params?.caseId || 'case_rti_001';
  const [fileDate, setFileDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMarkAsFiled = async () => {
    setIsSubmitting(true);
    try {
      // Simulate PATCH /api/cases/:caseId API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/dashboard');
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDE6DA] font-sans text-on-surface flex flex-col justify-between">
      {/* Top Header */}
      <header className="p-6 w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <span className="font-serif text-2xl text-primary font-bold tracking-tight">RightsTrack</span>
        </Link>
      </header>

      {/* Main Content Card */}
      <main className="w-full max-w-2xl bg-surface rounded-[20px] shadow-[0_4px_25px_rgba(27,67,50,0.08)] p-8 md:p-10 mx-auto border border-white/60 relative overflow-hidden my-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-6">
          <span className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Step 4 of 4
          </span>
          <div className="flex gap-1 w-24 h-1.5 bg-surface-variant rounded-full overflow-hidden">
            <div className="w-full h-full bg-primary rounded-full"></div>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2 mb-6">
          <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            task_alt
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary">
            Almost there — here's how to file this
          </h1>
          <p className="font-sans text-sm text-on-surface-variant">
            Follow these final steps to ensure your submission is legally binding and tracked.
          </p>
        </div>

        {/* Instructions Card */}
        <div className="bg-surface-container rounded-xl p-6 flex flex-col gap-5 border border-outline-variant/20 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm text-on-surface">Print or Save</span>
              <span className="text-xs text-on-surface-variant">
                Download your generated document. Ensure all details are verified.
              </span>
            </div>
          </div>

          <div className="w-full h-px bg-outline-variant/20 ml-12"></div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm text-on-surface">Submit to Authority</span>
              <span className="text-xs text-on-surface-variant">
                Submit physically via Registered Post / Speed Post, or online via official portal.
              </span>
            </div>
          </div>

          <div className="w-full h-px bg-outline-variant/20 ml-12"></div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm text-on-surface">Keep Receipt</span>
              <span className="text-xs text-on-surface-variant">
                Retain your postal receipt or electronic acknowledgment ID.
              </span>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="flex flex-col gap-4 border-t border-outline-variant/20 pt-6">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-on-surface" htmlFor="filing-date">
              When did you file this?
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top.1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                calendar_today
              </span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl border border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm text-on-surface"
                id="filing-date"
                type="date"
                value={fileDate}
                onChange={(e) => setFileDate(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleMarkAsFiled}
            disabled={isSubmitting}
            className="w-full bg-primary text-on-primary py-3.5 px-6 rounded-xl font-semibold text-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2 mt-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              how_to_reg
            </span>
            {isSubmitting ? 'Updating Case Status...' : 'Mark as filed & Start Deadline Tracker'}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-on-surface-variant text-xs mt-1">
            <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
            <span>We'll track your mandatory 30-day response deadline automatically.</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-outline-variant/20 bg-surface-container-low">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant">
          <span>© 2026 RightsTrack. Legal & Civic Transparency Platform.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Legal Disclaimer</a>
            <a href="#" className="hover:underline">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
