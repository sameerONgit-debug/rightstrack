'use client';

import { useState } from 'react';

export default function IntakeForm({ onSubmit, isLoading }) {
  const [text, setText] = useState('');

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
          placeholder="e.g., My landlord won't return my security deposit..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isLoading}
        ></textarea>
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
