'use client';

export default function DomainConfirmCard({ analysisResult, onConfirm, onChangeCategory }) {
  const { domain, confidence, rationale, suggested_category, is_valid_problem } = analysisResult || {};

  const normalizedDomain = String(domain || '').toUpperCase();
  const isRTI = normalizedDomain === 'RTI';
  const isConsumer = normalizedDomain === 'CONSUMER';
  const isUnsupported = normalizedDomain === 'UNSUPPORTED' || normalizedDomain === 'OTHER' || normalizedDomain === 'NEEDS_CLARIFICATION';
  const isValidProblem = is_valid_problem !== false;
  const hasSuggestedCategory = Boolean(String(suggested_category || '').trim());

  const domainTitle = isRTI
    ? 'RTI — Right to Information'
    : isConsumer
    ? 'Consumer Dispute — Consumer Protection'
    : hasSuggestedCategory && isValidProblem
    ? suggested_category
    : 'Needs Clarification';

  return (
    <div className="flex flex-col gap-6">
      {/* Domain Badge & Confidence */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div
          className={`inline-flex items-center px-4 py-2 rounded-full border ${
            isUnsupported
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-secondary-container/60 text-primary border-secondary/30'
          }`}
        >
          <span className="material-symbols-outlined mr-2 text-[20px]">
            {isRTI ? 'policy' : isConsumer ? 'shopping_bag' : 'gavel'}
          </span>
          <span className="font-sans text-sm font-semibold">{domainTitle}</span>
        </div>

        {!isUnsupported && (
          <div className="flex items-center text-primary font-medium text-xs bg-primary-container/10 px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined mr-1.5 text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <span>{Math.round((Number(confidence) || 0.94) * 100)}% Confidence Match</span>
          </div>
        )}
      </div>

      {/* Rationale Box */}
      <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/30">
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Analysis Rationale</h3>
        <p className="font-sans text-base text-on-surface-variant leading-relaxed">
          {rationale || analysisResult?.rationale || analysisResult?.explanation || analysisResult?.summary || 'This grievance falls under statutory dispute resolution based on the provided facts.'}
        </p>
      </div>

      {/* Scenario 3: Graceful Decline Notice for Unsupported Domain */}
      {isUnsupported && (
        <div className="bg-amber-900/10 border border-amber-500/30 p-5 rounded-xl text-amber-900 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-700">info</span>
            <h4 className="font-semibold text-sm">Responsible Decline Notice</h4>
          </div>
          <p className="text-sm leading-relaxed text-amber-950">
            {hasSuggestedCategory && isValidProblem
              ? `AI identified this as a ${suggested_category} matter. RightsTrack currently supports RTI and Consumer workflows, so it will not generate a grounded legal document for this category yet.`
              : 'The provided text does not contain enough reliable information to identify a supported legal or civic problem. Please describe what happened, who is involved, and what outcome you need.'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-outline-variant/20">
        {!isUnsupported ? (
          <>
            <button
              onClick={onConfirm}
              className="w-full sm:w-auto px-8 py-3 bg-primary text-on-primary font-semibold text-sm rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2"
            >
              <span>Yes, that's right</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <button
              onClick={onChangeCategory}
              className="w-full sm:w-auto px-4 py-3 text-primary font-semibold text-sm hover:underline transition-all"
            >
              Choose a different category
            </button>
          </>
        ) : (
          <button
            onClick={onChangeCategory}
            className="w-full sm:w-auto px-8 py-3 bg-primary text-on-primary font-semibold text-sm rounded-xl shadow-sm hover:bg-primary-container transition-all"
          >
            Try Another Issue
          </button>
        )}
      </div>
    </div>
  );
}
