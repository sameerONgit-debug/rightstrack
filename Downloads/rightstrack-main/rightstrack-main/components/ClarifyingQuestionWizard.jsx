'use client';

import { useState } from 'react';

export default function ClarifyingQuestionWizard({ questions = [], onComplete, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentValue, setCurrentValue] = useState('');
  const [error, setError] = useState('');

  const currentQ = questions[currentIndex] || {
    field_key: 'authority',
    question_text: 'Which government office or authority did you apply to?',
    input_type: 'text',
  };

  const handleNext = () => {
    if (!currentValue.trim()) {
      setError('Please provide an answer before continuing.');
      return;
    }
    setError('');
    const updatedAnswers = { ...answers, [currentQ.field_key]: currentValue };
    setAnswers(updatedAnswers);

    if (currentIndex < (questions?.length || 1) - 1) {
      setCurrentIndex(currentIndex + 1);
      const nextKey = questions[currentIndex + 1]?.field_key;
      setCurrentValue(updatedAnswers[nextKey] || '');
    } else {
      // Final question answered, submit batch
      onComplete(updatedAnswers);
    }
  };

  const handlePreviousStep = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      const prevKey = questions[currentIndex - 1]?.field_key;
      setCurrentValue(answers[prevKey] || '');
      setError('');
    } else {
      onBack();
    }
  };

  return (
    <div className="flex flex-col gap-8 items-center text-center max-w-lg mx-auto w-full">
      {/* Header & Dots */}
      <div className="flex flex-col items-center gap-2">
        <span className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          Question {currentIndex + 1} of {Math.max(questions?.length || 0, 1)}
        </span>
        <div className="flex gap-2">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-primary scale-110'
                  : idx < currentIndex
                  ? 'bg-secondary'
                  : 'bg-surface-variant'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question Content */}
      <div className="flex flex-col gap-4 w-full text-left">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary text-center">
          {currentQ.question_text}
        </h2>

        <div className="w-full flex flex-col gap-2">
          {currentQ.input_type === 'select' ? (
            <select
              className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-on-surface text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
            >
              <option value="">Select an option...</option>
              <option value="Online / Electronic Transfer">Online / Electronic Transfer</option>
              <option value="Court Fee Stamp / Postal Order">Court Fee Stamp / Postal Order</option>
              <option value="Cash at Receipt Counter">Cash at Receipt Counter</option>
            </select>
          ) : currentQ.input_type === 'date' ? (
            <input
              type="date"
              className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-on-surface text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
            />
          ) : (
            <input
              type="text"
              className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-on-surface text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/60"
              placeholder="Type your answer here..."
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            />
          )}

          {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
          <span className="text-xs text-on-surface-variant">
            This detail will be embedded directly into your legal document draft.
          </span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center w-full pt-4 border-t border-outline-variant/20">
        <button
          onClick={handlePreviousStep}
          className="font-sans font-semibold text-sm text-secondary border border-secondary/30 rounded-xl px-6 py-2.5 hover:bg-surface-container-low transition-all"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="font-sans font-semibold text-sm bg-primary text-on-primary rounded-xl px-6 py-2.5 hover:bg-primary-container transition-all flex items-center gap-2"
        >
          <span>{currentIndex === (questions?.length || 1) - 1 ? 'Generate Document' : 'Next'}</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
