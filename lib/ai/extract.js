/**
 * RightsTrack fact extraction and adaptive questioning.
 * Claude is primary. Rules are provider-failure fallbacks only.
 */

const COMMON_FIELDS = [
  'applicant_name', 'applicant_address', 'state', 'district', 'city',
  'authority_name', 'employer_name', 'merchant_name', 'organization_name',
  'product_or_service', 'issue', 'information_requested', 'purchase_date',
  'order_id', 'reference_id', 'claim_amount', 'amount_due', 'duration',
  'employment_type', 'employment_location', 'relief_sought', 'date_of_event',
];

const SCHEMAS = {
  RTI: ['authority_name', 'information_requested', 'applicant_name', 'applicant_address', 'state', 'district', 'reference_id'],
  Consumer: ['merchant_name', 'product_or_service', 'purchase_date', 'order_id', 'claim_amount', 'issue', 'relief_sought', 'state', 'district', 'applicant_name', 'applicant_address'],
  Unsupported: COMMON_FIELDS,
};

function firstMatch(text, regex) {
  const match = String(text || '').match(regex);
  return match ? (match[1] || match[0]).trim() : null;
}

function emptyFields(domain) {
  return Object.fromEntries((SCHEMAS[domain] || []).map((key) => [key, null]));
}

function heuristicExtract(text, domain) {
  const value = String(text || '');
  if (domain === 'RTI') {
    return {
      authority_name: firstMatch(value, /(?:office|department|authority|block office)\s+(?:at|of|named)?\s*([^,.]+?)(?:\s+and\b|,|\.|$)/i),
      information_requested: firstMatch(value, /(?:want|need|seeking|requesting)\s+(?:to know|information about|information on)?\s*([^,.]+?)(?:\s+and\b|,|\.|$)/i),
      applicant_name: null, applicant_address: null,
      state: null, district: null,
      reference_id: firstMatch(value, /(?:reference|application|acknowledg(?:e)?ment)\s*(?:no|number|id)?\s*[:#-]?\s*([A-Za-z0-9/-]+)/i),
    };
  }
  const result = emptyFields(domain);
  result.employer_name = firstMatch(value, /(?:employer|company|organization)\s+(?:is|:)?\s*([^,.]+?)(?:\s+and\b|,|\.|$)/i);
  result.merchant_name = firstMatch(value, /(?:seller|merchant|company)\s+(?:is|:)?\s*([^,.]+?)(?:\s+and\b|,|\.|$)/i);
  result.product_or_service = firstMatch(value, /(?:bought|purchased|ordered)\s+(?:a|an)?\s*([^,.]+?)(?:\s+and\b|,|\.|$)/i);
  result.purchase_date = firstMatch(value, /(?:on|dated)\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
  result.order_id = firstMatch(value, /(?:order|invoice)\s*(?:no|number|id)?\s*[:#-]?\s*([A-Za-z0-9/-]+)/i);
  result.claim_amount = firstMatch(value, /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/i);
  result.amount_due = firstMatch(value, /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(?:due|unpaid|owed)?/i);
  result.duration = firstMatch(value, /(?:for|since|from)\s+([\w\s-]+?)(?:\.|,|$)/i);
  result.issue = value.length ? value : null;
  result.relief_sought = /refund/i.test(value) ? 'Refund' : /salary|wages|payment/i.test(value) ? 'Payment of outstanding dues' : null;
  result.state = firstMatch(value, /\b(?:in|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  return result;
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
    if (!allowed.has(key) || value === null || value === undefined || value === '') continue;
    result[key] = typeof value === 'string' ? value.trim() : String(value);
  }
  return result;
}

async function extract(text, domain) {
  const extractionDomain = SCHEMAS[domain] ? domain : 'Unsupported';
  try {
    const { callClaude } = await import('./claude.js');
    const raw = await callClaude({
      systemPrompt: `You are RightsTrack's semantic fact extractor. Read the citizen's COMPLETE narrative, regardless of wording, spelling, grammar or vocabulary. Do not use keyword matching and do not guess. Extract only facts explicitly stated or unambiguously implied by the narrative. Missing values MUST be null. Preserve important chronology, amounts, actors and requested outcome.\n\nMatter type: ${domain}\nAllowed fields: ${SCHEMAS[extractionDomain].join(', ')}\n\nReturn ONLY valid JSON with exactly those fields.`,
      userPrompt: String(text).trim(), temperature: 0, maxTokens: 1200,
    });
    if (raw) return sanitizeFields(parseJson(raw), extractionDomain);
  } catch (err) {
    console.warn('[Extractor] AI unavailable; using deterministic fallback:', err.message);
  }
  return heuristicExtract(text, extractionDomain);
}

async function generateClarifyingQuestions({ narrative, domain, fields }) {
  try {
    const { callClaude } = await import('./claude.js');
    const raw = await callClaude({
      systemPrompt: `You are RightsTrack's adaptive legal intake interviewer. Generate the smallest useful set of follow-up questions for THIS exact citizen problem.\n\nQuestions must be derived from the actual facts and intended remedy, not a fixed questionnaire. Do not ask for information already present. Prioritize facts that can change legal applicability, responsible authority, jurisdiction, limitation/deadline, evidence, amount/harm, and remedy. Ask at most 6 questions. For a simple problem, ask only what is genuinely necessary. If location is required to identify the responsible office, ask for state and district/city.\n\nReturn ONLY JSON: {"questions":[{"id":"stable_short_id","question":"...","input_type":"text|number|date","required":true}]}\n\nMatter type: ${domain}\nKnown facts: ${JSON.stringify(fields)}`,
      userPrompt: narrative, temperature: 0.15, maxTokens: 1000,
    });
    if (!raw) throw new Error('AI question generation unavailable.');
    const parsed = parseJson(raw);
    return Array.isArray(parsed.questions) ? parsed.questions.filter(q => q?.question).map((q, i) => ({
      field_key: String(q.id || `ai_question_${i + 1}`),
      question_text: String(q.question),
      input_type: ['text', 'number', 'date'].includes(q.input_type) ? q.input_type : 'text',
      ai_generated: true,
    })) : [];
  } catch (err) {
    console.warn('[Questioner] AI unavailable; using minimal deterministic fallback:', err.message);
    return clarifyingQuestions(domain, fields);
  }
}

function clarifyingQuestions(domain, fields = {}) {
  const questions = {
    RTI: [['authority_name', 'Which department or public authority should receive the RTI application?', 'text'], ['information_requested', 'What exact information or records do you want from the authority?', 'text'], ['state', 'Which state and district is the authority located in?', 'text'], ['applicant_address', 'What address should be used for correspondence?', 'text']],
    Consumer: [['merchant_name', 'What is the seller, merchant, or service provider name?', 'text'], ['state', 'Which state and district should be used for the complaint?', 'text'], ['relief_sought', 'What outcome do you want?', 'text']],
    Unsupported: [['state', 'Which state are you in, or where did the problem occur?', 'text'], ['district', 'Which district or city is involved?', 'text'], ['relief_sought', 'What outcome would you like to achieve?', 'text']],
  };
  return (questions[domain] || []).filter(([key]) => !fields?.[key]).map(([field_key, question_text, input_type]) => ({ field_key, question_text, input_type }));
}

module.exports = { extract, generateClarifyingQuestions, clarifyingQuestions, SCHEMAS };
