/**
 * LegalDisclaimer — Mandatory invariant civic legal disclaimer component.
 * Specified in docs/AI_DEVELOPMENT_GUIDELINES.md.
 */
export default function LegalDisclaimer() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
      <div className="flex items-start gap-2">
        <span className="font-bold text-slate-800 uppercase tracking-wider">Legal Disclaimer:</span>
        <p>
          RightsTrack is an automated civic empowerment tool designed to assist citizens in structuring Right to Information (RTI) requests and Consumer Protection complaints under applicable Indian statutes. RightsTrack does not provide formal legal advice, representation, or attorney-client relationships. Users are encouraged to review statutory draft contents before submitting to public authorities or consumer forums.
        </p>
      </div>
    </div>
  );
}
