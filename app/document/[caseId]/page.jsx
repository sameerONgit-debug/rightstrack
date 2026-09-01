'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function normalizeCitation(citation) {
  return {
    ...citation,
    act: citation?.act || citation?.act_name || citation?.actName || 'Legal source',
    section: citation?.section || citation?.section_number || citation?.sectionNumber || '',
    quote: citation?.quote || citation?.section_title || citation?.sectionTitle || '',
  };
}

export default function DocumentViewPage() {
  const [doc, setDoc] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const rawDoc = sessionStorage.getItem('current_document') || sessionStorage.getItem('current_case');
    if (rawDoc) {
      try {
        const parsed = JSON.parse(rawDoc);
        const documentText = String(parsed.document_text || parsed.document?.content || parsed.draft || '').trim();
        const rawSections = Array.isArray(parsed.sections) ? parsed.sections : [];
        const guidanceSections = rawSections.filter((section) => String(section?.content || '').trim());
        const citations = Array.isArray(parsed.citations) ? parsed.citations.map(normalizeCitation) : [];

        setDoc({
          ...parsed,
          title: parsed.title || 'Legal / Civic Document',
          authorityRecipient: parsed.authorityRecipient || parsed.authority_recipient || 'Competent Authority',
          documentText,
          guidanceSections,
          citations,
        });
        return;
      } catch (e) {
        console.warn('[DocumentView] Could not parse stored document:', e);
      }
    }

    setDoc({
      title: 'Formal Legal Grievance & Application',
      authorityRecipient: 'To: Public Redressal Authority',
      documentText: 'No generated document was found. Please return to the case and generate the document again.',
      guidanceSections: [],
      citations: [],
    });
  }, []);

  if (!doc) return null;

  const copyDocument = async () => {
    const text = doc.documentText || doc.guidanceSections.map((s) => `${s.heading}\n${s.content}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#EDE6D6] p-4 md:p-6 text-[#2C2416]">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap gap-3 justify-between items-center bg-[#F4EFE6] px-5 py-4 rounded-2xl border border-[#DCD1BC] shadow-sm">
          <Link href="/dashboard" className="font-serif text-2xl font-black text-[#1A3826]">RightsTrack</Link>
          <div className="flex gap-2">
            <button onClick={copyDocument} className="px-3 py-2 bg-white border border-[#D5C8B4] rounded-xl text-xs font-bold hover:bg-[#F8F4EC]">
              {copied ? 'Copied' : 'Copy .TXT'}
            </button>
            <Link href="/dashboard" className="px-4 py-2 bg-[#1A3826] text-white rounded-xl text-xs font-bold hover:bg-[#244b37]">
              Go to Dashboard →
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <main className="lg:col-span-8 bg-[#F8F4EC] rounded-3xl border border-[#DCD1BC] shadow-sm overflow-hidden">
            <div className="px-7 py-6 border-b border-[#DCD1BC] bg-[#F4EFE6]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A6D56] mb-2">Generated Document</p>
              <h1 className="font-serif text-3xl font-bold text-[#1A3826] leading-tight">{doc.title}</h1>
              <p className="text-sm text-[#6B5E48] mt-2">{doc.authorityRecipient}</p>
            </div>

            <div className="p-7">
              {doc.documentText ? (
                <div className="rounded-2xl border border-[#DCD1BC] bg-white/60 p-6 md:p-8">
                  <div className="text-sm md:text-[15px] leading-7 whitespace-pre-wrap text-[#3E3423]">
                    {doc.documentText}
                  </div>
                </div>
              ) : doc.guidanceSections.length ? (
                <div className="space-y-6">
                  {doc.guidanceSections.map((section, idx) => (
                    <section key={idx}>
                      <h2 className="font-serif text-xl font-bold text-[#1A3826] mb-2">{section.heading}</h2>
                      <p className="text-sm leading-7 whitespace-pre-wrap text-[#3E3423]">{section.content}</p>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6B5E48]">No document content is available.</p>
              )}
            </div>
          </main>

          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-[#F8F4EC] rounded-2xl border border-[#DCD1BC] p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#7A6D56] mb-3">Document status</h2>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1A3826]">
                <span className="w-2 h-2 rounded-full bg-[#1A3826]" />
                Generated from case facts
              </div>
              {doc.explanation_text && <p className="mt-3 text-xs leading-5 text-[#6B5E48]">{doc.explanation_text}</p>}
            </div>

            <div className="bg-[#F8F4EC] rounded-2xl border border-[#DCD1BC] p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#7A6D56] mb-3">Statutory Citations</h2>
              {doc.citations.length ? (
                <div className="space-y-3">
                  {doc.citations.map((citation, idx) => (
                    <div key={idx} className="rounded-xl border border-[#DCD1BC] bg-white/50 p-3">
                      <h3 className="text-sm font-bold text-[#1A3826]">{citation.act}</h3>
                      {citation.section && <p className="text-xs font-mono text-[#6B5E48] mt-1">{citation.section}</p>}
                      {citation.quote && <p className="text-xs italic mt-2 leading-5 text-[#5B503F]">{citation.quote}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[#DCD1BC] bg-[#EFE8DA] p-3">
                  <p className="text-xs leading-5 text-[#6B5E48]">No verified statutory citation was retrieved for this document. Verify legal citations before filing.</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
