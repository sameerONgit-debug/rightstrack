import { callClaude } from '../ai/claude';
import { validateDocumentCitations } from '../rag/validator';

/**
 * RTI Document Drafter — Generates citation-grounded RTI Form A applications.
 */
export async function draftRtiApplication({ narrative, entities, retrievedPassages }) {
  const systemPrompt = `You are a specialized civic legal drafting assistant for Indian citizens.
Draft a formal Right to Information (RTI) application under Section 6(1) of the RTI Act 2005.

GROUNDING RULES:
1. Embed citations ONLY using explicit tags like [RTI-SEC-6(1)] or [RTI-SEC-7(1)].
2. Do not invent any non-existent statutory sections.
3. Structure clearly: Public Authority, Applicant Particulars, Information Requested, Relief Sought.`;

  const userPrompt = `
Applicant Details: ${JSON.stringify(entities)}
Narrative: ${narrative}
Verified Passages: ${JSON.stringify(retrievedPassages)}
`;

  let draftText = '';
  try {
    draftText = await callClaude({ systemPrompt, userPrompt });
  } catch (err) {
    console.warn('[RtiDrafter] Falling back to template draft:', err.message);
  }

  if (!draftText) {
    draftText = `BEFORE THE PUBLIC INFORMATION OFFICER (PIO)
${entities?.opposite_party || 'Public Authority'}

1. Name of Applicant: ${entities?.applicant_name || 'Aarav Sharma'}
2. Address: ${entities?.address || 'New Delhi, India'}

3. Particulars of Information Sought:
Under the provisions of [RTI-SEC-6(1)] of the Right to Information Act, 2005, the undersigned requests certified records regarding:
${narrative}

4. Mandatory Response Timeline:
Kindly provide the requested information within 30 days as prescribed under [RTI-SEC-7(1)].

Date: ${new Date().toLocaleDateString()}
Applicant Signature`;
  }

  // Deterministic validation
  const validation = validateDocumentCitations(draftText, retrievedPassages);

  return {
    content: validation.cleanText,
    citations: validation.verifiedCitations,
    isValid: validation.isValid,
  };
}
