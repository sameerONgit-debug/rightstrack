/**
 * RightsTrack fact extraction.
 * AI extracts only facts explicitly supported by the citizen narrative.
 * Regex extraction remains as a fallback if the AI provider is unavailable.
 */

const SCHEMAS = {
  RTI: ['authority_name', 'information_requested', 'applicant_name', 'applicant_address', 'reference_id'],
  Consumer: ['merchant_name', 'product_or_service', 'purchase_date', 'order_id', 'claim_amount', 'issue', 'relief_sought', 'state', 'applicant_name', 'applicant_address'],
};

function firstMatch(text, regex) {
  const match = String(text || '').match(regex);
  return match ? (match[1] || match[0]).trim() : null;
}

function emptyFields(domain) {
  return Object.fromEntries((SCHEMAS[domain] || []).map((key) => [key, null]));
}

function heuristicExtract(text, domain) {
  if (!SCHEMAS[domain]) return {};
  const value = String(text || '');

  if (domain === 'RTI') return {
    authority_name: firstMatch(value, /(?:office|department|authority|block office)\s+(?:at|of|named)?\s*([^,.]+?)(?:\s+and\b|,|\.|$)/i),
    information_requested: firstMatch(value, /(?:want|need|seeking|requesting)\s+(?:to know|information about|information on)?\s*([^,.]+?)(?:\s+and\b|,|\.|$)/i),
    applicant_name: null,
    applicant_address: null,
    reference_id: firstMatch(value, /(?:reference|application|acknowledg(?:e)?ment)\s*(?:no|number|id)?\s*[:#-]?\s*([A-Za-z0-9/-]+)/i),
  };

  return {
    merchant_name: firstMatch(value, /(?:seller|merchant|company)\s+(?:is|:)?\s*([^,.]+?)(?:\s+and\b|,|\.|$)/i),
    product_or_service: firstMatch(value, /(?:bought|purchased|ordered)\s+(?:a|an)?\s*([^,.]+?)(?:\s+and\b|,|\.|$)/i),
    purchase_date: firstMatch(value, /(?:on|dated)\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i),
    order_id: firstMatch(value, /(?:order|invoice)\s*(?:no|number|id)?\s*[:#-]?\s*([A-Za-z0-9/-]+)/i),
    claim_amount: firstMatch(value, /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/i),
    issue: firstMatch(value, /(?:problem|issue|defect|damaged|cracked|broken)\s*(?:is|was|:)?\s*([^,.]+?)(?:\s+and\b|,|\.|$)/i),
    relief_sought: /refund/i.test(value) ? 'Refund' : /replacement/i.test(value) ? 'Replacement' : null,
    state: firstMatch(value, /\b(?:in|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/),
    applicant_name: null,
    applicant_address: null,
  };
}

function parseJson(raw) {
  const text = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI returned no JSON object.');
  return JSON.parse(text.slice(start, end + 1));
}

function sanitizeFields(fields, domain) {
  const allowed = new Set(SCHEMAS[domain] || []);
  const result = emptyFields(domain);
  for (const [key, value] of Object.entries(fields || {})) {
    if (!allowed.has(key)) continue;
    if (value === null || value === undefined || value === '') continue;
    result[key] = String(value).trim();
  }
  return result;
}

async function extract(text, domain) {
  if (!SCHEMAS[domain]) return {};

  try {
    const { callClaude } = await import('./claude.js');
    const raw = await callClaude({
      systemPrompt: `You extract structured facts from Indian civic/legal narratives for RightsTrack.

Domain: ${domain}
Allowed fields: ${SCHEMAS[domain].join(', ')}

Extract ONLY facts explicitly stated or unambiguously given in the narrative. Never guess names, dates, amounts, addresses, legal claims, or remedies. Missing values MUST be null.
For relief_sought, use the user's stated desired outcome, not an assumed legal remedy.

Return ONLY valid JSON with exactly these allowed fields.`,
      userPrompt: String(text).trim(),
      temperature: 0,
      maxTokens: 900,
    });

    if (raw) return sanitizeFields(parseJson(raw), domain);
  } catch (err) {
    console.warn('[Extractor] AI extraction unavailable; using deterministic fallback:', err.message);
  }

  return heuristicExtract(text, domain);
}

function clarifyingQuestions(domain, fields) {
  const questions = {
    RTI: [
      ['authority_name', 'Which department or public authority should receive the RTI application?', 'text'],
      ['information_requested', 'What exact information or records do you want from the authority?', 'text'],
      ['applicant_address', 'What address should be used for correspondence?', 'text'],
    ],
    Consumer: [
      ['merchant_name', 'What is the seller, merchant, or service provider name?', 'text'],
      ['product_or_service', 'What product or service is involved?', 'text'],
      ['claim_amount', 'What was the purchase or claim amount?', 'number'],
      ['state', 'Which state should be used for the complaint?', 'text'],
      ['relief_sought', 'What outcome do you want: refund, replacement, repair, or another remedy?', 'text'],
    ],
  };

  return (questions[domain] || [])
    .filter(([key]) => !fields || !fields[key])
    .map(([field_key, question_text, input_type]) => ({ field_key, question_text, input_type }));
}

module.exports = { extract, clarifyingQuestions, SCHEMAS };
