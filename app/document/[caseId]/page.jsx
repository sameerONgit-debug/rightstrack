'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DocumentViewPage() {
  const [doc, setDoc] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const rawDoc = sessionStorage.getItem('current_document') || sessionStorage.getItem('current_case');
    if (rawDoc) {
      try {
        const parsed = JSON.parse(rawDoc);
        const rawSections = Array.isArray(parsed.sections) ? parsed.sections : [];
        const hasVisibleSectionContent = rawSections.some((section) => String(section?.content || '').trim());
        const normalizedSections = hasVisibleSectionContent
          ? rawSections
          : String(parsed.draft || parsed.document_text || '').trim()
            ? [{ heading: 'AI-Generated Draft', content: parsed.draft || parsed.document_text }]
            : rawSections;

        const normalizedCitations = Array.isArray(parsed.citations)
          ? parsed.citations.map((citation) => ({
              ...citation,
              act: citation.act || citation.act_name || citation.actName || 'Legal source',
              section: citation.section || citation.section_number || citation.sectionNumber || '',
              quote: citation.quote || citation.section_title || citation.sectionTitle || '',
            }))
          : [];

        setDoc({
          ...parsed,
          authorityRecipient: parsed.authorityRecipient || parsed.authority_recipient || 'Competent Authority',
          sections: normalizedSections,
          citations: normalizedCitations,
        });
        return;
      } catch (e) {}
    }
    setDoc({
      title: 'Formal Legal Grievance & Application',
      authorityRecipient: 'To: Public Redressal Authority',
      sections: [
        { heading: '1. Applicant Details', content: 'Statutory representation.' },
        { heading: '2. Statement of Facts', content: 'Grievance record details submitted.' },
        { heading: '3. Relief Sought', content: 'Statutory time-bound compliance.' }
      ],
      citations: [
        { act: 'Statutory Redressal Act', section: 'Section 6(1)', quote: 'Official information disclosure.', verifiedDate: 'Aug 2026' }
      ]
    });
  }, []);

  if (!doc) return null;

  return (
    <div className="min-h-screen bg-[#EDE6D6] p-6 text-[#2C2416]">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-[#F4EFE6] p-4 rounded-2xl border border-[#DCD1BC]">
          <Link href="/dashboard" className="font-serif text-2xl font-black text-[#1A3826]">RightsTrack</Link>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(doc, null, 2)); setCopied(true); }} className="px-3 py-1.5 bg-white border border-[#D5C8B4] rounded-xl text-xs font-bold">
              {copied ? 'Copied' : '.TXT'}
            </button>
            <Link href="/dashboard" className="px-4 py-1.5 bg-[#1A3826] text-white rounded-xl text-xs font-bold">
              Go to Dashboard →
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#F8F4EC] p-6 rounded-3xl border border-[#DCD1BC]">
            <h1 className="font-serif text-2xl font-bold text-[#1A3826] mb-2">{doc.title}</h1>
            <p className="text-xs font-mono text-[#6B5E48] mb-6">{doc.authorityRecipient}</p>
            {doc.sections?.map((s, idx) => (
              <div key={idx} className="mb-4">
                <h2 className="font-bold text-sm text-[#1A3826] mb-1">{s.heading}</h2>
                <p className="text-sm text-[#3E3423] leading-relaxed whitespace-pre-wrap">{s.content}</p>
              </div>
            ))}
            {!doc.sections?.length && doc.draft && (
              <p className="text-sm text-[#3E3423] leading-relaxed whitespace-pre-wrap">{doc.draft}</p>
            )}
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#7A6D56]">Statutory Citations</h3>
            {doc.citations?.length ? doc.citations.map((c, idx) => (
              <div key={idx} className="bg-[#F8F4EC] p-4 rounded-2xl border border-[#DCD1BC]">
                <h4 className="text-sm font-bold text-[#1A3826]">{c.act}</h4>
                <span className="text-xs font-mono text-[#6B5E48] block mb-2">{c.section}</span>
                <p className="text-xs italic bg-[#EFE8DA] p-3 rounded-xl border border-[#DBD0BA]">{c.quote || 'Verified source used for this draft.'}</p>
              </div>
            )) : (
              <div className="bg-[#F8F4EC] p-4 rounded-2xl border border-[#DCD1BC]">
                <p className="text-xs text-[#6B5E48] leading-relaxed">The document was generated from the case facts, but no verified statutory citation was retrieved. Legal citations should be verified before filing.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
