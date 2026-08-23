import { callClaude } from './claude';

/**
 * Entity Extractor — Identifies key statutory particulars (parties, dates, amounts, relief sought).
 */
export async function extractLegalEntities(narrative, domain) {
  const systemPrompt = `Extract key factual and legal entities from this narrative for a ${domain} filing in India.
Return JSON:
{
  "complainant_name": string | null,
  "opposite_party": string | null,
  "department": string | null,
  "transaction_amount": number | null,
  "incident_date": string | null,
  "relief_sought": string | null
}`;

  try {
    const rawResult = await callClaude({
      systemPrompt,
      userPrompt: narrative,
      temperature: 0.1,
    });

    if (rawResult) {
      return JSON.parse(rawResult);
    }
  } catch (err) {
    console.warn('[Extractor] Error in AI extraction:', err.message);
  }

  return {
    complainant_name: null,
    opposite_party: domain === 'RTI' ? 'Public Authority / Municipal Office' : 'Service Provider / Merchant',
    department: null,
    transaction_amount: null,
    incident_date: null,
    relief_sought: domain === 'RTI' ? 'Certified copies of official records' : 'Refund and compensation',
  };
}
