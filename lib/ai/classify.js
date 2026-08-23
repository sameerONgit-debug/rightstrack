/**
 * RightsTrack domain classification.
 *
 * Claude is the primary semantic classifier. Deterministic rules are only a
 * last-resort safety net when the AI provider is unavailable or malformed.
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
      systemPrompt: `You are the primary semantic AI classifier for RightsTrack, an Indian civic/legal assistance MVP.

Your job is to understand the MEANING of the citizen's situation, not to match keywords. Read the complete narrative, identify the actors, event, harm/problem, requested outcome, and determine which legal/civic workflow genuinely fits.

SUPPORTED WORKFLOWS — choose these ONLY when the facts genuinely fit:
- RTI: the citizen is seeking information, records, documents, status, transparency, tender/public-work records, or other information held by an Indian public authority/government body.
- CONSUMER: the citizen has a dispute with a business/service provider about goods or commercial services, including defective goods, deficient services, refunds, returns, warranties, billing, subscriptions, unfair trade practices, or compensation.

IMPORTANT: Many genuine legal problems are NOT RTI or CONSUMER. Do not force them into a supported workflow.
Examples that MUST be OTHER include:
- “My employer has not given me salary for the last 3 months.” → Employment / Labour Dispute
- “My landlord refuses to return my security deposit.” → Landlord / Tenant Dispute
- “My neighbour threatened me.” → Criminal / Personal Safety matter
- “My brother and I are fighting over inherited land.” → Property / Inheritance Dispute
- “My spouse wants a divorce.” → Family / Matrimonial Matter

For OTHER, suggest the category that best describes the actual situation in plain language. Do not invent a legal claim or statute.

For nonsense/random text or text that does not describe a coherent problem, use OTHER and set is_valid_problem=false.

A supported domain requires a positive factual basis. The mere presence of words such as “government”, “service”, “payment”, “company”, “application”, or “complaint” is NOT enough.

Confidence must represent your actual certainty. Never use 0.98/0.99 by default.

Return ONLY valid JSON:
{
  "domain": "RTI" | "CONSUMER" | "OTHER",
  "confidence": number between 0 and 1,
  "rationale": "brief explanation grounded only in the narrative",
  "suggested_category": "short category when domain is OTHER, otherwise empty string",
  "is_valid_problem": true | false
}`,
      userPrompt: narrative,
      temperature: 0,
      maxTokens: 700,
    });

    if (raw) {
      const result = normalizeAIResult(parseJson(raw));

      // A second semantic guard is used only for a supported-domain decision.
      // This prevents an otherwise plausible but wrong RTI/Consumer label from
      // sending an unrelated problem into the wrong legal workflow.
      if (result.domain === 'RTI' || result.domain === 'Consumer') {
        const reviewRaw = await callClaude({
          systemPrompt: `You are the final scope reviewer for RightsTrack. Decide whether the proposed workflow is genuinely supported by the citizen narrative.

RTI is supported only when the actual problem is obtaining information/records/status/transparency from an Indian public authority.
CONSUMER is supported only when the actual problem is a goods/commercial-service/consumer transaction dispute.
Employment/labour, unpaid wages, landlord/tenant, family, criminal, property, traffic, immigration, education admissions, and other unrelated legal problems are OTHER unless the narrative independently and clearly fits RTI or Consumer.

Do not be influenced by keywords. Compare the meaning of the narrative with the proposed workflow.

Return ONLY JSON:
{
  "supported": true | false,
  "suggested_category": "short category if supported=false, otherwise empty string",
  "reason": "one sentence"
}`,
          userPrompt: JSON.stringify({ narrative, proposed_domain: result.domain }),
          temperature: 0,
          maxTokens: 300,
        });

        if (reviewRaw) {
          const review = parseJson(reviewRaw);
          if (review?.supported === false) {
            return {
              ...result,
              domain: 'Unsupported',
              suggested_category: String(review.suggested_category || 'Other Legal / Civic Matter'),
              rationale: String(review.reason || result.rationale),
              ai_generated: true,
            };
          }
        }
      }

      return result;
    }
  } catch (err) {
    console.warn('[Classifier] AI classification unavailable; using deterministic fallback:', err.message);
  }

  return classifyHeuristic(narrative);
}

module.exports = { classify, classifyHeuristic, DOMAINS };
