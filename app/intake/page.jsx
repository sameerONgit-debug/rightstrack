'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import IntakeForm from '@/components/IntakeForm';
import ErrorState from '@/components/ErrorState';
import { apiFetch } from '@/lib/apiClient';

const LANGUAGES = {
  en: { label: 'English', locale: 'en-IN', heading: "What's going on?", helper: 'Describe your situation in your own words — no legal jargon needed.', placeholder: "e.g., My landlord won't return my security deposit...", speak: 'Speak', listening: 'Listening...' },
  hi: { label: 'हिन्दी / Hindi', locale: 'hi-IN', heading: 'क्या हुआ?', helper: 'अपनी स्थिति अपने शब्दों में बताएं — कानूनी भाषा की आवश्यकता नहीं है।', placeholder: 'उदाहरण: मेरे मकान मालिक ने मेरी जमा राशि वापस नहीं की...', speak: 'बोलें', listening: 'सुन रहे हैं...' },
  mr: { label: 'मराठी / Marathi', locale: 'mr-IN', heading: 'काय झाले?', helper: 'तुमची परिस्थिती तुमच्या शब्दांत सांगा — कायदेशीर भाषा आवश्यक नाही.', placeholder: 'उदाहरण: माझ्या मालकाने माझी ठेव परत केली नाही...', speak: 'बोला', listening: 'ऐकत आहे...' },
  bn: { label: 'বাংলা / Bengali', locale: 'bn-IN', heading: 'কী হয়েছে?', helper: 'আপনার নিজের ভাষায় পরিস্থিতি বর্ণনা করুন — আইনি পরিভাষার প্রয়োজন নেই।', placeholder: 'উদাহরণ: আমার বাড়িওয়ালা আমার জামানত ফেরত দিচ্ছেন না...', speak: 'বলুন', listening: 'শুনছি...' },
  ta: { label: 'தமிழ் / Tamil', locale: 'ta-IN', heading: 'என்ன நடந்தது?', helper: 'உங்கள் சொந்த வார்த்தைகளில் நிலைமையை விவரிக்கவும் — சட்ட மொழி தேவையில்லை.', placeholder: 'எடுத்துக்காட்டு: என் வீட்டு உரிமையாளர் முன்பணத்தைத் திருப்பித் தரவில்லை...', speak: 'பேசுங்கள்', listening: 'கேட்கிறது...' },
};

export default function IntakePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [phoneticHindi, setPhoneticHindi] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('selected_language') || 'en';
    setSelectedLang(LANGUAGES[savedLanguage] ? savedLanguage : 'en');
    setPhoneticHindi(localStorage.getItem('phonetic_hindi') === 'true');
  }, []);

  const handleLanguageChange = (event) => {
    const language = event.target.value;
    setSelectedLang(LANGUAGES[language] ? language : 'en');
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
        body: JSON.stringify({ narrative: inputText, prompt: inputText, language: selectedLang }),
      });
      if (apiError) throw new Error(apiError.message);

      const analysis = data?.data || data;
      if (!analysis?.domain) throw new Error('The analysis response was incomplete.');
      const questions = analysis.clarifying_questions || analysis.clarifications || [];
      sessionStorage.setItem('current_analysis', JSON.stringify({ ...analysis, clarifying_questions: questions, language: selectedLang, narrative: inputText }));
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
            {Object.entries(LANGUAGES).map(([code, language]) => <option key={code} value={code}>{language.label}</option>)}
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
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary">{LANGUAGES[selectedLang].heading}</h1>
          <p className="font-sans text-base text-on-surface-variant leading-relaxed">
            {LANGUAGES[selectedLang].helper}
          </p>
        </div>

        {/* Form or Error */}
        {error ? (
          <ErrorState message={error} onRetry={() => setError(null)} />
        ) : (
          <IntakeForm onSubmit={handleAnalyze} isLoading={isLoading} language={selectedLang} speechLocale={LANGUAGES[selectedLang].locale} phoneticHindi={phoneticHindi} copy={LANGUAGES[selectedLang]} />
        )}
      </main>
    </div>
  );
}
