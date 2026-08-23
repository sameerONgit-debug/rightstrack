import { validateDocumentCitations } from '../rag/validator';

/**
 * Appeal Drafter — Automatically prepares statutory First Appeal or Non-Compliance Notice when deadlines pass.
 */
export function draftFirstAppeal({ originalCase, grounds = 'Deemed Refusal under Section 7(2)' }) {
  const draftText = `BEFORE THE FIRST APPELLATE AUTHORITY
(Under Section 19(1) of the Right to Information Act, 2005)

In the matter of:
Appellant: ${originalCase?.applicant_name || 'Aarav Sharma'}
Vs.
Public Information Officer: ${originalCase?.public_authority || 'Public Authority'}

MEMORANDUM OF FIRST APPEAL UNDER [RTI-SEC-19(1)]

1. Particulars of Original Application:
The Appellant filed an RTI application under [RTI-SEC-6(1)] on ${originalCase?.filing_date || 'the registered date'}.

2. Statutory Breach:
As per [RTI-SEC-7(1)], the PIO was obligated to provide information within 30 days. No reply or decision was communicated, amounting to a deemed refusal under Section 7(2).

3. Prayer / Relief Sought:
The Appellant prays that the First Appellate Authority direct the PIO to immediately furnish the requested records free of cost and initiate penal proceedings under Section 20 if default was intentional.

Date: ${new Date().toLocaleDateString()}
Appellant Signature`;

  const statutoryChunks = [
    { citation_key: 'RTI-SEC-6(1)' },
    { citation_key: 'RTI-SEC-7(1)' },
    { citation_key: 'RTI-SEC-19(1)' },
  ];

  const validation = validateDocumentCitations(draftText, statutoryChunks);

  return {
    appeal_document: validation.cleanText,
    citations: validation.verifiedCitations,
    isValid: validation.isValid,
  };
}
