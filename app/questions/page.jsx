'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClarifyingQuestionWizard from '@/components/ClarifyingQuestionWizard';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { apiFetch } from '@/lib/apiClient';

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('current_analysis');
    if (stored) {
      const parsed = JSON.parse(stored);
      setAnalysisResult(parsed);
      const storedQuestions = parsed.clarifying_questions?.length
        ? parsed.clarifying_questions
        : (parsed.questions || []).map((question) => ({
            field_key: question.key,
            question_text: question.text,
            input_type: 'text',
          }));
      setQuestions(storedQuestions);
    } else {
      setError('Your analysis session has expired. Please start a new intake.');
    }
  }, []);

  const handleWizardComplete = async (collectedAnswers) => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: apiError } = await apiFetch('/api/cases', {
        method: 'POST',
        body: JSON.stringify({ analysis: analysisResult, answers: collectedAnswers, language: analysisResult?.language || localStorage.getItem('selected_language') || 'en' }),
      });
      if (apiError) throw new Error(apiError.message);

      sessionStorage.setItem('collected_fields', JSON.stringify(collectedAnswers));
      sessionStorage.setItem('current_case', JSON.stringify(data));
      router.push(`/document/${data.caseId}`);
    } catch (err) {
      setError(err.message || 'We could not draft your document. Please try again.');
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
        {error ? (
          <ErrorState message={error} onRetry={() => setError(null)} />
        ) : isGenerating ? (
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
