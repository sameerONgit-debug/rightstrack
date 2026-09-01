'use client';

/**
 * CitationBadge — Displays verified legal citations with statutory inspection modal triggers.
 * Part of the anti-hallucination verification interface.
 */
export default function CitationBadge({ citationKey, section, statute, onInspect }) {
  return (
    <button
      type="button"
      onClick={() => onInspect?.(citationKey)}
      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-mono font-medium text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer"
      title={`Verified statutory citation: ${statute || 'Statute'} - ${section || citationKey}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
      <span>[{citationKey}]</span>
    </button>
  );
}
