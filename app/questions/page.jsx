'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
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
          id: String(q?.id || `q_${idx+1}`),
          key: String(q?.key || q?.fieldKey || q?.field_key || `key_${idx+1}`),
          field_key: String(q?.key || q?.fieldKey || q?.field_key || `key_${idx+1}`),
          fieldKey: String(q?.key || q?.fieldKey || q?.field_key || `key_${idx+1}`),
          question_text: String(q?.question_text || q?.questionText || 'Specify required detail:'),
          questionText: String(q?.question_text || q?.questionText || 'Specify required detail:'),
          category: String(q?.category || 'General'),
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

  const handleComplete = (answers) => {
    setIsGenerating(true);
    const caseId = `case_${Date.now()}`;
    const domain = analysisResult?.domain || 'RTI';
    const text = analysisResult?.extracted_fields?.issue || analysisResult?.summary || 'Grievance Description';

    const doc = {
      id: caseId,
      domain: domain === 'CONSUMER' ? 'Consumer Protection' : domain === 'CYBER' ? 'Cyber Crime' : 'Right to Information',
      title: domain === 'CONSUMER' ? 'Formal Legal Notice under Consumer Protection Act, 2019'
           : domain === 'CYBER' ? 'Statutory Petition for Cyber Fraud & Unauthorized Transaction'
           : 'Application for Information under Section 6(1) of RTI Act, 2005',
      authorityRecipient: domain === 'CONSUMER' ? 'To: District Consumer Disputes Redressal Commission'
                        : domain === 'CYBER' ? 'To: Cyber Crime Cell & Nodal Officer'
                        : 'To: Public Information Officer / Appellate Authority',
      sections: [
        { heading: '1. Applicant & Subject Details', content: `Statutory application filed under Reference #${caseId}.` },
        { heading: '2. Statement of Facts', content: text },
        { heading: '3. Mandatory Statutory Relief', content: 'Demanding official resolution within statutory timeline.' }
      ],
      citations: [
        {
          act: domain === 'CONSUMER' ? 'Consumer Protection Act, 2019' : domain === 'CYBER' ? 'Information Technology Act, 2000' : 'Right to Information Act, 2005',
          section: domain === 'CONSUMER' ? 'Section 2(11)' : domain === 'CYBER' ? 'Section 66D' : 'Section 6(1)',
          quote: 'Statutory mandate enforced by competent authority under governing legal provisions.',
          verifiedDate: 'Aug 2026'
        }
      ]
    };

    sessionStorage.setItem('current_document', JSON.stringify(doc));
    sessionStorage.setItem('current_case', JSON.stringify(doc));
    router.push(`/document/${caseId}`);
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