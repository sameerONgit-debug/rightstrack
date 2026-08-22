'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClarifyingQuestionWizard from '@/components/ClarifyingQuestionWizard';
import LoadingState from '@/components/LoadingState';
import { mockAnalyzeRTI } from '@/lib/mockData';

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('current_analysis');
    if (stored) {
      const parsed = JSON.parse(stored);
      setAnalysisResult(parsed);
      setQuestions(parsed.clarifying_questions || mockAnalyzeRTI.clarifying_questions);
    } else {
      setQuestions(mockAnalyzeRTI.clarifying_questions);
    }
  }, []);

  const handleWizardComplete = async (collectedAnswers) => {
    setIsGenerating(true);

    try {
      // Simulate POST /api/cases generation (3s perceived latency as required by spec)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const domain = analysisResult?.domain || 'RTI';
      const caseId = domain === 'Consumer' ? 'case_consumer_001' : 'case_rti_001';

      sessionStorage.setItem('collected_fields', JSON.stringify(collectedAnswers));
      router.push(`/document/${caseId}`);
    } catch (err) {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDE6DA] font-sans text-on-surface flex flex-col items-center justify-center p-6 relative">
      {/* Top Header */}
      <header className="fixed top-0 left-0 p-6 w-full flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <span className="font-serif text-2xl text-primary font-bold tracking-tight">RightsTrack</span>
        </Link>
      </header>

      {/* Main Content Card */}
      <main className="w-full max-w-2xl bg-surface rounded-[20px] shadow-[0_4px_25px_rgba(27,67,50,0.08)] p-8 md:p-10 flex flex-col gap-6 mt-12 border border-white/60">
        {isGenerating ? (
          <LoadingState message="Retrieving relevant law… Drafting your application…" />
        ) : (
          <ClarifyingQuestionWizard
            questions={questions}
            onComplete={handleWizardComplete}
            onBack={() => router.push('/confirm')}
          />
        )}
      </main>
    </div>
  );
}
