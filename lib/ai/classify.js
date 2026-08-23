/**
 * RightsTrack domain classification.
 *
 * AI is the primary classifier. The keyword rules below are only a safety
 * fallback when the AI provider is unavailable or returns invalid JSON.
 */

const DOMAINS = ['RTI', 'Consumer', 'Unsupported'];

function parseJson(raw) {
  const text = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI returned no JSON object.');
  return JSON.parse(text.slice(start, end + 1));
}

function normalizeAIResult(result) {
  const domain = String(result?.domain || '').toUpperCase();
  const confidence = Number(result?.confidence);
  const validConfidence = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.5;

  if (!['RTI', 'CONSUMER', 'OTHER'].includes(domain)) {
    throw new Error('AI returned an invalid domain.');
  }

  return {
    domain: domain === 'CONSUMER' ? 'Consumer' : domain === 'RTI' ? 'RTI' : 'Unsupported',
    confidence: validConfidence,
    rationale: String(result?.rationale || 'The AI could not provide a rationale.'),
    suggested_category: String(result?.suggested_category || ''),
    is_valid_problem: result?.is_valid_problem !== false,
    ai_generated: true,
  };
}

function classifyHeuristic(text) {
  const value = String(text || '').trim().toLowerCase();
  const rti = /\brti\b|right to information|public information|pio|public authority|government office|subsidy|scheme|official records|status of (my|the) application|block office|municipal|government department|tender|civic work/i.test(value);
  const consumer = /refund|return|seller|merchant|invoice|order|purchase|bought|defective|damaged|warranty|delivery|consumer|product|service provider|compensation|subscription|bank charge|insurance claim/i.test(value);

  if (rti && !consumer) return { domain: 'RTI', confidence: 0.72, rationale: 'The narrative contains facts indicating a government-information or public-authority issue.', ai_generated: false };
  if (consumer && !rti) return { domain: 'Consumer', confidence: 0.72, rationale: 'The narrative contains facts indicating a consumer transaction, goods, or service dispute.', ai_generated: false };
  if (rti && consumer) return { domain: 'RTI', confidence: 0.55, rationale: 'The narrative overlaps government and consumer issues and needs clarification before choosing a legal pathway.', ai_generated: false };
  return {
    domain: 'Unsupported',
    confidence: 0.2,
    rationale: 'The narrative does not contain enough reliable information to identify an RTI or Consumer matter.',
    suggested_category: '',
    is_valid_problem: value.length >= 12,
    ai_generated: false,
  };
}

async function classify(text) {
  if (!text || !String(text).trim()) throw new Error('Classification requires non-empty text.');

  const narrative = String(text).trim();

  try {
    const { callClaude } = await import('./claude.js');
    const raw = await callClaude({
      systemPrompt: `You are the primary AI intake classifier for RightsTrack, an Indian civic/legal assistance MVP.

Analyze the citizen's narrative semantically. DO NOT classify based on a fixed keyword list. Understand the meaning, actors, events, requested outcome, and legal/civic context.

Supported workflows:
- RTI: requests for information, records, documents, status, transparency, tenders, public works, or information held by an Indian public authority/government body.
- CONSUMER: disputes involving goods or commercial services, defective products, deficient services, refunds, returns, warranties, billing, subscriptions, unfair trade practices, or compensation from a business/service provider.

If the narrative is a coherent legal/civic problem but is outside those two workflows, use OTHER and suggest the most appropriate category in plain language (for example landlord-tenant, employment, family, traffic, criminal, property, banking, etc.).
If the text is nonsense, random characters, too vague to identify a problem, or not describing a real situation, use OTHER and set is_valid_problem to false.

Never invent facts. Confidence must reflect actual certainty; do not use 0.98 or 0.99 merely because the request is clear.

Return ONLY valid JSON:
{
  "domain": "RTI" | "CONSUMER" | "OTHER",
  "confidence": number between 0 and 1,
  "rationale": "brief explanation grounded in the narrative",
  "suggested_category": "short category when domain is OTHER, otherwise empty string",
  "is_valid_problem": true | false
}`,
      userPrompt: narrative,
      temperature: 0.1,
      maxTokens: 700,
    });

    if (raw) return normalizeAIResult(parseJson(raw));
  } catch (err) {
    console.warn('[Classifier] AI classification unavailable; using deterministic fallback:', err.message);
  }

  return classifyHeuristic(narrative);
}

module.exports = { classify, classifyHeuristic, DOMAINS };
