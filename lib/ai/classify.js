/**
 * RightsTrack domain classification.
 * Gemini is the primary semantic classifier. Deterministic rules are only a
 * last-resort safety net when the primary AI classification itself fails.
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
  if (!['RTI', 'CONSUMER', 'OTHER'].includes(domain)) throw new Error('AI returned an invalid domain.');
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
  if (rti && consumer && !employment) return { domain: 'RTI', confidence: 0.55, rationale: 'The narrative overlaps government and consumer issues and needs clarification before choosing a legal pathway.', ai_generated: false };

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

  // IMPORTANT: the result of this first AI call is authoritative for this stage.
  // A later optional quality-review call must never erase a successful semantic
  // classification and replace it with the keyword fallback.
  let result;
  try {
    const { callClaude } = await import('./claude.js');
    const raw = await callClaude({
      systemPrompt: `You are RightsTrack's primary semantic AI classifier for Indian civic and legal assistance.

Understand the COMPLETE narrative semantically. Do not classify by keywords, memorized phrases, or a predefined list of example sentences. Infer the situation from its actors, events, harm, requested outcome, and context.

Supported workflows:
- RTI: the citizen is actually seeking information, records, documents, status, transparency, or other information held by an Indian public authority/government body.
- CONSUMER: the citizen actually has a dispute involving goods or a commercial service/business, such as defective goods, deficient service, refund, return, warranty, billing, subscription, unfair trade practice, or compensation.

Everything else must be OTHER when it does not genuinely fit those two workflows. For OTHER, infer and return the most useful plain-language category from the narrative itself. The category must be generated from the user's situation, not selected from a fixed category menu. Examples include employment, housing, family, property, criminal, education, transport, or any other category when appropriate, but these are illustrations rather than a closed set.

A supported workflow requires a positive factual basis. Do not force a narrative into RTI or CONSUMER merely because it contains words such as government, company, service, payment, application, complaint, or office.

If the narrative is nonsense, random text, or does not describe a coherent problem, use OTHER and set is_valid_problem=false.

Confidence must represent actual semantic certainty. Never use inflated confidence by default.

Return ONLY valid JSON:
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
    console.warn('[Classifier] Primary AI classification unavailable; using deterministic fallback:', err.message);
    return classifyHeuristic(narrative);
  }

  // Quality review is deliberately best-effort. If it fails because of quota,
  // rate limits, model availability, or a transient network problem, keep the
  // already-successful AI classification instead of falling back to keywords.
  if (result.domain === 'RTI' || result.domain === 'Consumer') {
    try {
      const { callClaude } = await import('./claude.js');
      const reviewRaw = await callClaude({
        systemPrompt: `You are RightsTrack's final semantic scope reviewer.

Read the citizen narrative and the proposed workflow. Decide whether the workflow genuinely matches the substance of the problem. Ignore keywords and do not rely on a fixed category list.

RTI is valid only when the substance is obtaining information/records/status/transparency from a public authority. CONSUMER is valid only when the substance is a commercial goods/service/consumer dispute. If the problem belongs to any other area, reject the proposed workflow and generate the most accurate plain-language category from the narrative.

Return ONLY JSON:
{
  "supported": true | false,
  "suggested_category": "AI-generated category if unsupported, otherwise empty string",
  "reason": "one sentence grounded in the narrative"
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
    } catch (err) {
      console.warn('[Classifier] AI quality review unavailable; preserving primary AI result:', err.message);
    }
  }

  return result;
}

module.exports = { classify, classifyHeuristic, DOMAINS };
