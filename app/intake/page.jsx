'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import IntakeForm from '@/components/IntakeForm';
import ErrorState from '@/components/ErrorState';
import { apiFetch } from '@/lib/apiClient';

export default function IntakePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [phoneticHindi, setPhoneticHindi] = useState(false);

  useEffect(() => {
    setSelectedLang(localStorage.getItem('selected_language') || 'en');
    setPhoneticHindi(localStorage.getItem('phonetic_hindi') === 'true');
  }, []);

  const handleLanguageChange = (event) => {
    const language = event.target.value;
    setSelectedLang(language);
    localStorage.setItem('selected_language', language);
  };

  const handlePhoneticToggle = (event) => {
    const enabled = event.target.checked;
    setPhoneticHindi(enabled);
    localStorage.setItem('phonetic_hindi', String(enabled));
    if (enabled) {
      setSelectedLang('hi');
      localStorage.setItem('selected_language', 'hi');
    }
  };

  const handleAnalyze = async (inputText) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await apiFetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ prompt: inputText, language: selectedLang }),
      });
      if (apiError) throw new Error(apiError.message);

      sessionStorage.setItem('current_analysis', JSON.stringify({ ...data, language: selectedLang }));
      router.push('/confirm');
    } catch (err) {
      setError("We couldn't process that — try rephrasing, or describe just the core issue in one sentence.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDE6DA] font-sans text-on-surface flex flex-col items-center justify-center p-6 relative">
      {/* Top Header */}
      <header className="fixed top-0 left-0 p-6 w-full flex items-center justify-between z-10 pointer-events-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <span className="font-serif text-2xl text-primary font-bold tracking-tight">RightsTrack</span>
        </Link>
        <div className="flex items-center gap-3">
          <select
            aria-label="Language"
            value={selectedLang}
            onChange={handleLanguageChange}
            className="rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-primary shadow-sm"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी / Hindi</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <input type="checkbox" checked={phoneticHindi} onChange={handlePhoneticToggle} className="h-4 w-4 accent-primary" />
            Type in Hindi (Phonetic / Hinglish to हिन्दी)
          </label>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="w-full max-w-2xl bg-surface rounded-[20px] shadow-[0_4px_25px_rgba(27,67,50,0.08)] p-8 md:p-10 flex flex-col gap-6 mt-12 border border-white/60">
        {/* Step Indicator */}
        <div className="flex items-center gap-3">
          <span className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Step 1 of 4
          </span>
          <div className="flex gap-1 w-24 h-1.5 bg-surface-variant rounded-full overflow-hidden">
            <div className="w-1/4 h-full bg-primary rounded-full"></div>
          </div>
        </div>

        {/* Heading & Subtext */}
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary">What's going on?</h1>
          <p className="font-sans text-base text-on-surface-variant leading-relaxed">
            Describe your situation in your own words — no legal jargon needed.
          </p>
        </div>

        {/* Form or Error */}
        {error ? (
          <ErrorState message={error} onRetry={() => setError(null)} />
        ) : (
          <IntakeForm onSubmit={handleAnalyze} isLoading={isLoading} language={selectedLang} phoneticHindi={phoneticHindi} />
        )}
      </main>
    </div>
  );
}
