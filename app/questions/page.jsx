'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClarifyingQuestions from '@/components/ClarifyingQuestionWizard';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('current_analysis');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAnalysisResult(parsed);
        const raw = parsed.clarifyingQuestions || parsed.clarifying_questions || [];
        setQuestions(raw.map((q, idx) => ({
          id: String(q?.id || `q_${idx + 1}`),
          key: String(q?.key || q?.fieldKey || q?.field_key || `key_${idx + 1}`),
          field_key: String(q?.key || q?.fieldKey || q?.field_key || `key_${idx + 1}`),
          fieldKey: String(q?.key || q?.fieldKey || q?.field_key || `key_${idx + 1}`),
          question_text: String(q?.question_text || q?.questionText || 'Specify required detail:'),
          questionText: String(q?.question_text || q?.questionText || 'Specify required detail:'),
          category: String(q?.category || 'AI'),
          priority: String(q?.priority || 'medium'),
          input_type: String(q?.input_type || q?.inputType || 'text'),
          inputType: String(q?.input_type || q?.inputType || 'text'),
        })));
      } catch (e) {
        setError('Session expired. Please restart intake.');
      }
    } else {
      setError('Session expired. Please restart intake.');
    }
  }, []);

  const handleComplete = async (answers) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: analysisResult?.domain,
          suggested_category: analysisResult?.suggested_category || '',
          narrative: analysisResult?.narrative || sessionStorage.getItem('current_narrative') || '',
          extracted_fields: analysisResult?.entities || analysisResult?.extracted_fields || {},
          answers,
          language: analysisResult?.lang || 'en',
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'AI could not generate the case guidance and document.');
      }

      const caseId = `case_${Date.now()}`;
      const doc = { id: caseId, ...payload.data };
      sessionStorage.setItem('current_document', JSON.stringify(doc));
      sessionStorage.setItem('current_case', JSON.stringify(doc));
      router.push(`/document/${caseId}`);
    } catch (err) {
      console.error('[Questions] AI drafting failed:', err);
      setError(err.message || 'Unable to generate the document. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDE6D6] p-4 flex flex-col items-center justify-center">
      <main className="w-full max-w-2xl bg-[#F8F4EC] rounded-2xl p-6 md:p-8 border border-[#DCD1BC] shadow-xl">
        {error ? <ErrorState message={error} onRetry={() => router.push('/intake')} />
         : isGenerating ? <LoadingState message="Drafting your petition..." />
         : <ClarifyingQuestions questions={questions} onComplete={handleComplete} onBack={() => router.push('/confirm')} />}
      </main>
    </div>
  );
}
