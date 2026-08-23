'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


const LANGUAGES = {
  en: { 
    label: 'English', 
    locale: 'en-IN', 
    heading: "What's going on?", 
    helper: 'Describe your situation in your own words.',
    promptVoice: 'Hello! Please tell me, what grievance or problem are you facing? I am listening.',
    femaleNames: ['google uk english female', 'neerja', 'samantha', 'victoria', 'zira', 'kavya', 'natural', 'female']
  },
  hi: { 
    label: 'हिन्दी / Hindi', 
    locale: 'hi-IN', 
    heading: 'क्या हुआ?', 
    helper: 'अपनी स्थिति अपने शब्दों में बताएं - कानूनी भाषा की ज़रूरत नहीं है',
    promptVoice: 'नमस्ते! आपके साथ क्या समस्या हुई है? कृपया विस्तार से बताइए, मैं सुन रही हूँ।',
    femaleNames: ['google हिन्दी', 'swara', 'kalpana', 'heera', 'natural', 'female']
  },
  mr: { 
    label: 'मराठी / Marathi', 
    locale: 'mr-IN', 
    heading: 'काय झाले?', 
    helper: 'तुमची परिस्थिती तुमच्या शब्दांत सांगा - कायद्याची भाषा आवश्यक नाही',
    promptVoice: 'नमस्कार! आपल्यासोबत नेमकी काय समस्या झाली आहे? कृपया सांगा, मी ऐकत आहे.',
    femaleNames: ['google मराठी', 'aarohi', 'natural', 'female', 'swara', 'google हिन्दी']
  },
  bn: { 
    label: 'বাংলা / Bengali', 
    locale: 'bn-IN', 
    heading: 'কী হয়েছে?', 
    helper: 'আপনার নিজের ভাষায় পরিস্থিতি বর্ণনা করুন - আইনি ভাষার প্রয়োজন নেই',
    promptVoice: 'নমস্কার! আপনার কী समस्या হয়েছে? দয়া করে বিস্তারিত বলুন, আমি শুনছি।',
    femaleNames: ['google বাংলা', 'tanishaa', 'bashkar', 'natural', 'female', 'swara', 'google हिन्दी']
  },
  ta: { 
    label: 'தமிழ் / Tamil', 
    locale: 'ta-IN', 
    heading: 'என்ன நடந்தது?', 
    helper: 'உங்கள் சொந்த வார்த்தைகளில் விவரிக்கவும் - சட்ட மொழி தேவையில்லை',
    promptVoice: 'வணக்கம்! உங்களுக்கு என்ன பிரச்சனை ஏற்பட்டுள்ளது? தயவுசெய்து சொல்லுங்கள், நான் கேட்கிறேன்.',
    femaleNames: ['google தமிழ்', 'pallavi', 'natural', 'female', 'swara', 'google हिन्दी']
  },
};

export default function IntakePage() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [phoneticHindi, setPhoneticHindi] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('selected_language') || 'en';
    if (LANGUAGES[savedLang]) setSelectedLang(savedLang);
    setPhoneticHindi(localStorage.getItem('phonetic_hindi') === 'true');

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }

    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        if (event.error !== 'no-speech') setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setSelectedLang(LANGUAGES[lang] ? lang : 'en');
    localStorage.setItem('selected_language', lang);
  };

  const handlePhoneticToggle = (e) => {
    const enabled = e.target.checked;
    setPhoneticHindi(enabled);
    localStorage.setItem('phonetic_hindi', String(enabled));
    if (enabled) {
      setSelectedLang('hi');
      localStorage.setItem('selected_language', 'hi');
    }
  };

  // Female Voice Synthesizer
  const speakVoicePrompt = (textToSpeak, callback) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (callback) callback();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const config = LANGUAGES[selectedLang] || LANGUAGES.en;
    const targetLocale = config.locale;

    utterance.lang = targetLocale;
    utterance.rate = 0.88;
    utterance.pitch = 1.25;

    const voices = window.speechSynthesis.getVoices();

    const findFemaleVoice = () => {
      for (const targetName of config.femaleNames) {
        const found = voices.find((v) => v.name.toLowerCase().includes(targetName));
        if (found) return found;
      }

      const langFemale = voices.find(
        (v) =>
          v.lang.toLowerCase().replace('_', '-').startsWith(targetLocale.split('-')[0]) &&
          !v.name.toLowerCase().includes('male') &&
          !v.name.toLowerCase().includes('david') &&
          !v.name.toLowerCase().includes('george') &&
          !v.name.toLowerCase().includes('ravi')
      );
      if (langFemale) return langFemale;

      const indianFemale = voices.find(
        (v) =>
          (v.name.toLowerCase().includes('swara') ||
           v.name.toLowerCase().includes('neerja') ||
           v.name.toLowerCase().includes('zira') ||
           v.name.toLowerCase().includes('samantha'))
      );
      if (indianFemale) return indianFemale;

      return null;
    };

    const selectedVoice = findFemaleVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    let isDone = false;
    const done = () => {
      if (!isDone) {
        isDone = true;
        if (callback) callback();
      }
    };

    const safetyTimer = setTimeout(done, 4000);

    utterance.onend = () => {
      clearTimeout(safetyTimer);
      done();
    };

    utterance.onerror = () => {
      clearTimeout(safetyTimer);
      done();
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Voice assistant is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      const voicePrompt = LANGUAGES[selectedLang]?.promptVoice || LANGUAGES.en.promptVoice;

      speakVoicePrompt(voicePrompt, () => {
        try {
          recognitionRef.current.lang = LANGUAGES[selectedLang]?.locale || 'en-IN';
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {
          console.error('Recognition start error:', err);
          setIsListening(false);
        }
      });
    }
  };

  const handleAnalyze = async (textToAnalyze) => {
    const query = textToAnalyze || inputText;
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narrative: query, prompt: query, language: selectedLang }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Analysis request failed.');
      }

      const analysis = json.data || json;
      if (!analysis?.domain) {
        throw new Error('The analysis response was incomplete.');
      }

      const questions = analysis.clarifying_questions || analysis.clarifications || [];
      sessionStorage.setItem('current_analysis', JSON.stringify({ ...analysis, clarifying_questions: questions, lang: selectedLang }));

      // Dashboard Sync
      try {
        const newCase = {
          id: `case_${Date.now()}`,
          domain: analysis?.domain || 'Consumer',
          title: analysis?.extracted_fields?.title || analysis?.extracted_fields?.issue || 'Consumer Flight Refund Grievance',
          status: 'drafted',
          deadline_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          days_remaining: 30,
        };
        const stored = JSON.parse(localStorage.getItem('rightstrack_cases') || '[]');
        localStorage.setItem('rightstrack_cases', JSON.stringify([newCase, ...stored]));
      } catch (e) {
        console.error('Storage sync error:', e);
      }

      router.push('/confirm');
    } catch (err) {
      setError(err.message || 'We could not process that — please try rephrasing in a clear sentence.');
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-[#EDE6D6] font-sans text-on-surface flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden selection:bg-[#1A3826] selection:text-white">
      
      {/* 🌟 Background Layer 1: Geometric Grid Texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#1A3826 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* 🌟 Background Layer 2: Glowing Ambient Radial Lights */}
      <div className="absolute top-[-15%] left-[-10%] w-[520px] h-[520px] bg-gradient-to-br from-[#1A3826]/15 via-[#2C5E40]/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[580px] h-[580px] bg-gradient-to-tl from-[#C89D56]/15 via-[#D6B575]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[35%] right-[15%] w-72 h-72 bg-[#8C5D38]/5 rounded-full blur-2xl pointer-events-none" />

      {/* 🌟 Top Navigation Bar with Frosted Glass Layer */}
      <header className="w-full max-w-3xl flex justify-between items-center mb-6 z-10 backdrop-blur-md bg-[#F4EFE6]/70 p-3 px-5 rounded-2xl border border-[#DCD1BC] shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A3826] to-[#0E2015] text-[#EDE6D6] flex items-center justify-center shadow-md shadow-[#1A3826]/20 group-hover:scale-105 transition-all ring-1 ring-white/30">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <div>
            <span className="font-serif text-2xl font-black text-[#1A3826] tracking-tight block leading-tight">RightsTrack</span>
          </div>
        </Link>

        <div className="flex items-center gap-2.5">
          <label className="hidden sm:flex items-center gap-2 bg-[#E9E0CE] hover:bg-[#DFD5C2] px-3 py-1.5 rounded-xl border border-[#D5C7AF] text-xs font-bold text-[#1A3826] cursor-pointer transition-all shadow-inner">
            <input
              type="checkbox"
              checked={phoneticHindi}
              onChange={handlePhoneticToggle}
              className="accent-[#1A3826] w-3.5 h-3.5 rounded cursor-pointer"
            />
            Hinglish
          </label>

          <div className="flex items-center gap-1.5 bg-[#E9E0CE] px-3 py-1.5 rounded-xl border border-[#D5C7AF] shadow-inner">
            <span className="material-symbols-outlined text-[17px] text-[#7A6D56]">language</span>
            <select
              value={selectedLang}
              onChange={handleLanguageChange}
              className="bg-transparent text-xs font-bold text-[#1A3826] focus:outline-none cursor-pointer"
            >
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <option key={code} value={code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* 🌟 Main Intake Box with Multi-Layer Shadow & Border Highlights */}
      <main className="w-full max-w-3xl bg-[#F8F4EC]/95 backdrop-blur-xl rounded-3xl border border-[#DCD1BC] p-6 sm:p-10 shadow-[0_20px_50px_-10px_rgba(44,36,22,0.12)] relative z-10 ring-1 ring-white/80">
        
        {/* Subtle Decorative Top Glow Line */}
        <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-[#1A3826]/40 to-transparent" />

        {/* Step Indicator Pill */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E5DBCA]">
          <div className="inline-flex items-center gap-2 bg-[#EFE8DA] px-3 py-1 rounded-full border border-[#D8CDBC]">
            <span className="w-2 h-2 rounded-full bg-[#1A3826] animate-ping" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#5C4F3B] font-bold">
              Step 1 of 3 · AI Legal Intake
            </span>
          </div>
          
          <div className="flex gap-1.5 items-center">
            <div className="w-8 h-2 bg-gradient-to-r from-[#1A3826] to-[#2E5E41] rounded-full shadow-sm" />
            <div className="w-3 h-2 bg-[#D8CEBA] rounded-full" />
            <div className="w-3 h-2 bg-[#D8CEBA] rounded-full" />
          </div>
        </div>

        {/* Heading & Helper */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl md:text-4xl font-black text-[#1A3826] tracking-tight">
            {LANGUAGES[selectedLang]?.heading || "What's going on?"}
          </h1>
          <p className="text-sm text-[#6B5E48] mt-2 leading-relaxed font-medium">
            {LANGUAGES[selectedLang]?.helper || 'Describe your situation in your own words or tap the voice assistant.'}
          </p>
        </div>

        {/* Layered Textarea Container with Floating Accent */}
        <div className="relative mb-6 group">
          <textarea
            rows={6}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? `Voice Assistant Active: Listening attentively in ${LANGUAGES[selectedLang]?.label}...`
                : 'e.g. I filed an RTI 40 days ago, but the department has not replied yet...'
            }
            className={`w-full p-5 pb-16 rounded-2xl bg-white/90 border ${
              isListening 
                ? 'border-[#1A3826] ring-4 ring-[#1A3826]/10 shadow-[0_0_20px_rgba(26,56,38,0.15)]' 
                : 'border-[#D0C4AC] focus:border-[#1A3826] focus:ring-4 focus:ring-[#1A3826]/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]'
            } text-[#2C2416] placeholder:text-[#9E907B] focus:outline-none text-base leading-relaxed resize-none transition-all duration-200`}
          />

          {/* Floating Action Voice Assistant Capsule */}
          <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2 bg-[#F3ECE0] px-3.5 py-2 rounded-2xl border border-[#D5C8B4] shadow-[0_4px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm">
            {isListening && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1A3826] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1A3826]"></span>
              </span>
            )}
            <button
              type="button"
              onClick={toggleListening}
              className={`flex items-center gap-2 text-xs font-bold tracking-wide transition-all ${
                isListening
                  ? 'text-[#1A3826] animate-pulse'
                  : 'text-[#1A3826] hover:text-[#0C1D13]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isListening ? 'graphic_eq' : 'mic'}
              </span>
              {isListening ? 'Assistant Listening...' : 'Speak with Assistant'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50/90 border border-red-200 text-red-700 text-sm flex items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-red-600 text-[20px]">error</span>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Link
            href="/dashboard"
            className="text-xs font-bold text-[#6B5E48] hover:text-[#1A3826] transition-colors order-2 sm:order-1 flex items-center gap-1"
          >
            ← Cancel & Return to Dashboard
          </Link>

          <button
            onClick={() => handleAnalyze()}
            disabled={isLoading || !inputText.trim()}
            className="w-full sm:w-auto bg-gradient-to-r from-[#1A3826] to-[#254A34] hover:from-[#12281B] hover:to-[#1A3826] disabled:opacity-40 text-[#EDE6D6] font-bold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-[#1A3826]/20 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 order-1 sm:order-2 ring-1 ring-white/20"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing Legal Grounds...
              </>
            ) : (
              <>
                Analyze & Draft Petition
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}