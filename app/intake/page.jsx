'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function IntakePage() {
  const [narrative, setNarrative] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Submit narrative to /api/analyze
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Step 1: Describe Your Problem</h1>
        <p className="mt-2 text-slate-600">
          Explain what happened in plain words. Include dates, authorities or companies involved, and what outcome or relief you are seeking.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <label htmlFor="narrative" className="block text-sm font-semibold text-slate-800 mb-2">
            Your Narrative
          </label>
          <textarea
            id="narrative"
            rows={7}
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="e.g. I applied for a government road repair tender status in my ward 40 days ago, but the municipal office has not replied. Or: I purchased a mobile phone online for Rs. 22,000 which stopped working within 10 days, and the seller refused a warranty repair."
            className="w-full rounded-xl border border-slate-300 p-4 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
            required
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-700">
            ← Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 transition"
          >
            {loading ? 'Analyzing Legal Framework...' : 'Analyze & Classify Problem →'}
          </button>
        </div>
      </form>
    </div>
  );
}
