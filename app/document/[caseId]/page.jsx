'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DisclaimerBanner from '@/components/DisclaimerBanner';
import DocumentViewer from '@/components/DocumentViewer';

export default function DocumentPage({ params }) {
  const router = useRouter();
  const caseId = params?.caseId || 'case_rti_001';
  const isConsumer = caseId.includes('consumer');

  const handleProceedToFile = () => {
    router.push(`/file/${caseId}`);
  };

  return (
    <div className="min-h-screen bg-[#EDE6DA] font-sans text-on-surface flex flex-col">
      {/* Header */}
      <header className="bg-surface border-b border-outline-variant/20 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <span className="font-serif text-2xl text-primary font-bold tracking-tight">RightsTrack</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-primary hover:text-secondary px-3 py-1.5 rounded-lg border border-secondary/30 transition-all"
            >
              My Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Persistent Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        <DocumentViewer
          caseId={caseId}
          domain={isConsumer ? 'Consumer' : 'RTI'}
          grounded={true}
          onProceedToFile={handleProceedToFile}
        />
      </main>
    </div>
  );
}
