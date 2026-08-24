/**
 * RightsTrack semantic domain classifier.
 *
 * AI is authoritative. The old keyword classifier is intentionally opt-in via
 * AI_ALLOW_FALLBACK=true; otherwise an unavailable AI provider is surfaced as
 * an error instead of presenting a misleading "Fallback Match" to the user.
 */

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
  if (!['RTI', 'CONSUMER', 'OTHER'].includes(domain)) throw new Error(`AI returned invalid domain: ${domain || 'empty'}`);
  const validConfidence = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.5;

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
  const employment = /employer|employment|employee|salary|wages?|pay|paid|unpaid|arrears|job|workplace|termination|dismissed|overtime|gratuity|bonus|leave|workman|labou?r/i.test(value);
  const housing = /landlord|tenant|rent|evict|eviction|lease|house|flat|housing|property possession/i.test(value);
  const education = /college|university|school|student|exam|marksheet|degree|admission|scholarship|education/i.test(value);

  if (rti && !consumer && !employment) return { domain: 'RTI', confidence: 0.72, rationale: 'The narrative contains facts indicating a government-information or public-authority issue.', ai_generated: false };
  if (consumer && !rti && !employment) return { domain: 'Consumer', confidence: 0.72, rationale: 'The narrative contains facts indicating a consumer transaction, goods, or service dispute.', ai_generated: false };

  let suggested_category = '';
  if (employment) suggested_category = 'Employment / Wage Dispute';
  else if (housing) suggested_category = 'Housing / Tenancy Dispute';
  else if (education) suggested_category = 'Education / Student Grievance';
  else if (value.length >= 12) suggested_category = 'Other Legal / Civic Matter';

  return {
    domain: 'Unsupported',
    confidence: suggested_category ? 0.62 : 0.2,
    rationale: suggested_category
      ? `The narrative appears to describe a ${suggested_category.toLowerCase()}, which is outside the RTI/Consumer workflow.`
      : 'The narrative does not contain enough reliable information to identify a supported legal workflow.',
    suggested_category,
    is_valid_problem: value.length >= 12,
    ai_generated: false,
  };
}

async function classify(text) {
  if (!text || !String(text).trim()) throw new Error('Classification requires non-empty text.');
  const narrative = String(text).trim();

  let result;
  try {
    const { callClaude } = await import('./claude.js');
    const raw = await callClaude({
      systemPrompt: `You are RightsTrack's primary semantic AI classifier for Indian civic and legal assistance.

Understand the COMPLETE narrative semantically. Do not classify by keywords, memorized phrases, or a predefined list of example sentences. Infer the situation from actors, events, harm, requested outcome, and context.

Supported workflows are not a closed category list. RTI means the citizen seeks information, records, documents, status or transparency from an Indian public authority. CONSUMER means the substance is a commercial goods/service or consumer-protection dispute. For every other coherent grievance, use OTHER and generate the most accurate plain-language category from the narrative itself. Examples such as employment, housing, family, property, criminal, education or banking are illustrations only.

Never force a grievance into RTI or CONSUMER merely because it mentions a company, government, payment, application, complaint, service or office. Confidence must reflect actual semantic certainty.

Return ONLY JSON:
{
  "domain": "RTI" | "CONSUMER" | "OTHER",
  "confidence": number between 0 and 1,
  "rationale": "brief explanation grounded only in the narrative",
  "suggested_category": "AI-generated plain-language category when OTHER, otherwise empty string",
  "is_valid_problem": true | false
}`,
      userPrompt: narrative,
      temperature: 0,
      maxTokens: 700,
    });

    if (!raw) throw new Error('Primary AI provider returned no classification.');
    result = normalizeAIResult(parseJson(raw));
  } catch (err) {
    console.error('[Classifier] Primary AI classification failed:', err?.message || err);
    if (String(process.env.AI_ALLOW_FALLBACK).toLowerCase() === 'true') return classifyHeuristic(narrative);
    throw new Error(`AI classification unavailable: ${err?.message || 'provider failure'}`);
  }

  // Every successful classification receives a second independent semantic
  // scope check. This prevents an AI hallucination or shallow interpretation
  // from forcing an unrelated grievance into the RTI/Consumer workflows.
  try {
    const { callClaude } = await import('./claude.js');
    const reviewRaw = await callClaude({
      systemPrompt: `You are RightsTrack's final semantic classification reviewer for Indian legal and civic grievances.

Read the COMPLETE narrative and the proposed classification. Do not use keyword matching. Determine whether the proposed classification actually describes the substance of the grievance.

RTI is valid only when the citizen's goal is obtaining information, records, documents, status or transparency from an Indian public authority. CONSUMER is valid only when the substance is a commercial goods/service or consumer-protection dispute. Employment/wage, housing/tenancy, education, family, property, criminal, banking, benefits, workplace and other coherent grievances must NOT be forced into RTI or CONSUMER merely because they mention money, an organization, an application, a service, or a complaint.

If the proposed classification is wrong, return the correct domain OTHER and generate a precise category. If it is correct, preserve it. Return ONLY JSON:
{
  "supported": true | false,
  "domain": "RTI" | "CONSUMER" | "OTHER",
  "suggested_category": "plain-language category when OTHER, otherwise empty string",
  "confidence": number between 0 and 1,
  "reason": "brief explanation grounded in the narrative"
}`,
      userPrompt: JSON.stringify({ narrative, proposed_classification: result }),
      temperature: 0,
      maxTokens: 400,
    });

    if (reviewRaw) {
      const review = parseJson(reviewRaw);
      const reviewDomain = String(review?.domain || '').toUpperCase();
      const supported = review?.supported !== false;

      if (!supported || reviewDomain === 'OTHER') {
        const reviewConfidence = Number(review?.confidence);
        return {
          ...result,
          domain: 'Unsupported',
          confidence: Number.isFinite(reviewConfidence) ? Math.max(0, Math.min(1, reviewConfidence)) : Math.min(result.confidence, 0.85),
          suggested_category: String(review?.suggested_category || result.suggested_category || 'Other Legal / Civic Matter'),
          rationale: String(review?.reason || result.rationale),
          ai_generated: true,
        };
      }

      if ((reviewDomain === 'RTI' || reviewDomain === 'CONSUMER') && reviewDomain !== result.domain.toUpperCase()) {
        return {
          ...result,
          domain: reviewDomain === 'RTI' ? 'RTI' : 'Consumer',
          confidence: Number.isFinite(Number(review?.confidence)) ? Math.max(0, Math.min(1, Number(review.confidence))) : result.confidence,
          rationale: String(review?.reason || result.rationale),
          ai_generated: true,
        };
      }
    }
  } catch (err) {
    // The second pass is deliberately best-effort: a temporary review failure
    // must not destroy a valid primary AI classification.
    console.warn('[Classifier] Semantic review failed; preserving primary result:', err?.message || err);
  }

  return result;
}

module.exports = { classify, classifyHeuristic };
