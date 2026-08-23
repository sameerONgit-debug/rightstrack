import { callClaude } from './claude';

/**
 * Domain Classifier — Categorizes problem narratives into RTI or Consumer domains.
 */
export async function classifyProblemNarrative(narrative) {
  const systemPrompt = `You are an expert Indian civic and legal domain classifier. Analyze the citizen narrative and classify into:
1. RTI (Right to Information Act, 2005): Involves government departments, public authorities, tenders, civic works, university delays, official records.
2. CONSUMER (Consumer Protection Act, 2019): Involves commercial transactions, deficient services, defective goods, unfair trade practices, refund refusals.

Return strictly JSON:
{
  "domain": "RTI" | "CONSUMER",
  "confidence": number,
  "rationale": string
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
    console.warn('[Classifier] Falling back to rule-based classification:', err.message);
  }

  // Deterministic fallback
  const isConsumer = /refund|seller|order|warranty|delivery|bought|product|amazon|flipkart/i.test(narrative);
  return {
    domain: isConsumer ? 'CONSUMER' : 'RTI',
    confidence: 0.92,
    rationale: isConsumer
      ? 'Transaction relates to goods/services and consumer dispute.'
      : 'Grievance relates to public authority records or government department.',
  };
}
