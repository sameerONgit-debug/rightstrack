'use client';

import { useRef, useState } from 'react';

const PHONETIC_WORDS = {
  kisan: 'किसान',
  paise: 'पैसे',
  paisa: 'पैसा',
  refund: 'रिफंड',
  seller: 'सेलर',
  product: 'प्रोडक्ट',
  cooker: 'कुकर',
  amazon: 'अमेज़न',
  flipkart: 'फ्लिपकार्ट',
  warranty: 'वारंटी',
  defect: 'दोष',
  landlord: 'मकान मालिक',
  tenant: 'किरायेदार',
  rent: 'किराया',
  deposit: 'जमा राशि',
  eviction: 'बेदखली',
  salary: 'वेतन',
  wages: 'मजदूरी',
  employer: 'नियोक्ता',
  company: 'कंपनी',
  job: 'नौकरी',
  work: 'काम',
  government: 'सरकार',
  officer: 'अधिकारी',
  record: 'रिकॉर्ड',
};

export default function IntakeForm({ onSubmit, isLoading, language = 'en', speechLocale = 'en-IN', phoneticHindi = false, copy = {} }) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');
  const committedVoiceText = useRef('');

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError('Voice input is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLocale;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => {
      setMicError('');
      committedVoiceText.current = text;
      setIsListening(true);
    };
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      if (finalTranscript) {
        committedVoiceText.current = `${committedVoiceText.current}${committedVoiceText.current && !committedVoiceText.current.endsWith(' ') ? ' ' : ''}${finalTranscript.trim()}`;
      }
      setText(`${committedVoiceText.current}${interimTranscript ? `${committedVoiceText.current && !committedVoiceText.current.endsWith(' ') ? ' ' : ''}${interimTranscript}` : ''}`);
    };
    recognition.onerror = (event) => {
      setMicError(event.error === 'not-allowed' ? 'Microphone permission was denied.' : 'Voice input could not be started.');
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleChipClick = (chipText) => {
    if (chipText === 'PM-KISAN farmer subsidy delay') {
      setText("My PM-KISAN farmer subsidy hasn't come in 3 months and the block office won't tell me what's wrong");
    } else if (chipText === 'Online seller refund refused') {
      setText("I bought a pressure cooker online for ₹2,400, it arrived with a cracked lid, and the seller is refusing to refund me");
    } else if (chipText === 'Landlord eviction without notice') {
      setText("My landlord is trying to evict me without giving proper notice");
    } else {
      setText(chipText);
    }
  };

  const handleTextKeyDown = (event) => {
    if (!phoneticHindi || event.key !== ' ' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    const input = event.currentTarget;
    const cursor = input.selectionStart;
    const beforeCursor = text.slice(0, cursor);
    const match = beforeCursor.match(/(^|\s)([^\s]+)$/);
    if (!match) return;
    const translated = PHONETIC_WORDS[match[2].toLowerCase()];
    if (!translated) return;

    event.preventDefault();
    const wordStart = cursor - match[2].length;
    const nextText = `${text.slice(0, wordStart)}${translated} ${text.slice(cursor)}`;
    setText(nextText);
    requestAnimationFrame(() => {
      input.setSelectionRange(wordStart + translated.length + 1, wordStart + translated.length + 1);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSubmit(text);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Textarea */}
      <div className="relative w-full">
        <textarea
          className="w-full min-h-[180px] bg-surface rounded-xl border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 p-4 font-sans text-base text-on-surface placeholder:text-outline resize-y shadow-sm outline-none transition-all"
          placeholder={copy.placeholder || "e.g., My landlord won't return my security deposit..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleTextKeyDown}
          disabled={isLoading}
        ></textarea>
        <button
          type="button"
          onClick={handleMicClick}
          disabled={isLoading || isListening}
          aria-label={isListening ? 'Listening' : 'Start voice input'}
          className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-xs font-semibold text-primary shadow-sm disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined text-[18px] ${isListening ? 'text-red-600 animate-pulse' : ''}`}>mic</span>
          {isListening ? (copy.listening || 'Listening...') : (copy.speak || 'Speak')}
        </button>
        {micError && <p className="mt-2 text-xs text-red-600">{micError}</p>}
      </div>

      {/* Suggestion Chips */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-on-surface-variant tracking-wide uppercase">Try an example:</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleChipClick('PM-KISAN farmer subsidy delay')}
            className="px-3.5 py-1.5 bg-secondary-container/40 hover:bg-secondary-container/70 rounded-full text-xs font-medium text-primary border border-secondary/20 transition-colors text-left"
          >
            🌾 PM-KISAN subsidy delay
          </button>
          <button
            type="button"
            onClick={() => handleChipClick('Online seller refund refused')}
            className="px-3.5 py-1.5 bg-secondary-container/40 hover:bg-secondary-container/70 rounded-full text-xs font-medium text-primary border border-secondary/20 transition-colors text-left"
          >
            📦 Refund refused for defective product
          </button>
          <button
            type="button"
            onClick={() => handleChipClick('Landlord eviction without notice')}
            className="px-3.5 py-1.5 bg-secondary-container/40 hover:bg-secondary-container/70 rounded-full text-xs font-medium text-primary border border-secondary/20 transition-colors text-left"
          >
            🏠 Landlord eviction dispute
          </button>
        </div>
      </div>

      {/* CTA Action */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          className="bg-primary text-on-primary font-semibold text-sm px-6 py-3 rounded-xl shadow-sm hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Reading your situation…
            </>
          ) : (
            <>
              Analyze
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
