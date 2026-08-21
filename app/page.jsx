import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <span>Problem Statement PS3</span>
          <span className="text-emerald-500">•</span>
          <span>AI for Civic and Legal Empowerment</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Describe your problem once — get the right legal document, and{' '}
          <span className="text-emerald-700 underline decoration-emerald-300 decoration-4">
            never miss a deadline again.
          </span>
        </h1>

        <p className="text-lg text-slate-600">
          RightsTrack turns plain-text citizen grievances into citation-grounded RTI applications and Consumer Protection complaints, opens a tracked case with auto-calculated statutory deadlines, and automatically drafts an escalation appeal if authorities don&apos;t reply.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/intake"
            className="w-full sm:w-auto rounded-xl bg-emerald-700 px-8 py-3.5 text-base font-bold text-white shadow-lg hover:bg-emerald-800 transition"
          >
            Start Your Case (Free Intake) →
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            View Active Case Tracker
          </Link>
        </div>
      </div>

      {/* 3 Pillars / Differentiators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold mb-4">
            1
          </div>
          <h3 className="text-lg font-bold text-slate-900">Conversational Intake & Domain AI</h3>
          <p className="mt-2 text-sm text-slate-600">
            Tell us what happened in everyday plain English. Our AI classifies whether your problem falls under the Right to Information (RTI) Act 2005 or the Consumer Protection Act 2019.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-800 font-bold mb-4">
            2
          </div>
          <h3 className="text-lg font-bold text-slate-900">Anti-Hallucination Legal RAG</h3>
          <p className="mt-2 text-sm text-slate-600">
            Every legal section in drafted documents is retrieved from verified statutory knowledge bases. Citation keys are validated by deterministic code before display.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-bold mb-4">
            3
          </div>
          <h3 className="text-lg font-bold text-slate-900">Statutory Deadline & Auto-Escalation</h3>
          <p className="mt-2 text-sm text-slate-600">
            Not just a document generator. RightsTrack calculates exact legal response windows (30 days) and automatically drafts a First Appeal when deadlines pass with no reply.
          </p>
        </div>
      </div>
    </div>
  );
}
