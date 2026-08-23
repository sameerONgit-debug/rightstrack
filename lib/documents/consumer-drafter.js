import { callClaude } from '../ai/claude';
import { validateDocumentCitations } from '../rag/validator';

/**
 * Consumer Complaint Drafter — Generates citation-grounded complaints under Consumer Protection Act 2019.
 */
export async function draftConsumerComplaint({ narrative, entities, retrievedPassages }) {
  const systemPrompt = `You are a legal drafting assistant for Indian consumer disputes.
Draft a formal Consumer Complaint under Section 35 of the Consumer Protection Act, 2019.
Use verified citations like [CPA-SEC-2(11)] or [CPA-SEC-35].`;

  const userPrompt = `
Parties: ${JSON.stringify(entities)}
Narrative: ${narrative}
Verified Passages: ${JSON.stringify(retrievedPassages)}
`;

  let draftText = '';
  try {
    draftText = await callClaude({ systemPrompt, userPrompt });
  } catch (err) {
    console.warn('[ConsumerDrafter] Falling back to template draft:', err.message);
  }

  if (!draftText) {
    draftText = `BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION
In the matter of:
${entities?.applicant_name || 'Complainant'} vs ${entities?.opposite_party || 'Opposite Party'}

COMPLAINT UNDER [CPA-SEC-35] OF THE CONSUMER PROTECTION ACT, 2019

1. The Complainant purchased goods/services for consideration from the Opposite Party.
2. The Opposite Party committed deficiency in service under [CPA-SEC-2(11)] by failing to deliver or remedy defects.
3. Relief Claimed: Full refund of transaction amount with interest and litigation costs.`;
  }

  const validation = validateDocumentCitations(draftText, retrievedPassages);

  return {
    content: validation.cleanText,
    citations: validation.verifiedCitations,
    isValid: validation.isValid,
  };
}
