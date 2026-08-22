'use client';

export default function DisclaimerBanner() {
  return (
    <div className="bg-surface-container-highest border-b border-outline-variant/30 py-3 px-6 w-full shadow-xs">
      <div className="max-w-6xl mx-auto flex items-start sm:items-center gap-3 text-xs md:text-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-secondary shrink-0 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          info
        </span>
        <p className="leading-relaxed">
          <strong className="font-semibold text-on-surface">Notice:</strong> This is general legal information, not legal advice. Verify before filing. Consult a lawyer or legal aid clinic for guidance specific to your situation.
        </p>
      </div>
    </div>
  );
}
