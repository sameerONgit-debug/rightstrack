/**
 * RightsTrack fact extraction and adaptive questioning.
 * Claude is used for both semantic extraction and question generation.
 * Deterministic extraction is only a provider-failure fallback.
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
    applicant_name: null, applicant_address: null,
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
    applicant_name: null, applicant_address: null,
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
    if (!allowed.has(key) || value === null || value === undefined || value === '') continue;
    result[key] = String(value).trim();
  }
  return result;
}

async function extract(text, domain) {
  if (!SCHEMAS[domain]) return {};
  try {
    const { callClaude } = await import('./claude.js');
    const raw = await callClaude({
      systemPrompt: `You extract structured facts from an Indian civic/legal narrative for RightsTrack.\n\nDomain: ${domain}\nAllowed fields: ${SCHEMAS[domain].join(', ')}\n\nExtract ONLY facts explicitly stated or unambiguously given. Never guess. Missing values MUST be null. For relief_sought, use the user's desired outcome, not an assumed remedy. Return ONLY valid JSON with exactly the allowed fields.`,
      userPrompt: String(text).trim(), temperature: 0, maxTokens: 900,
    });
    if (raw) return sanitizeFields(parseJson(raw), domain);
  } catch (err) {
    console.warn('[Extractor] AI unavailable; using deterministic fallback:', err.message);
  }
  return heuristicExtract(text, domain);
}

async function generateClarifyingQuestions({ narrative, domain, fields }) {
  if (!SCHEMAS[domain]) return [];
  try {
    const { callClaude } = await import('./claude.js');
    const raw = await callClaude({
      systemPrompt: `You are RightsTrack's adaptive legal intake interviewer. Generate the smallest useful set of follow-up questions for THIS specific citizen problem.\n\nDo not use a fixed questionnaire. Questions must depend on the narrative, domain and facts already known. Do not ask for information already present. Prioritize facts needed to identify the correct authority, chronology, evidence, harm/amount, and desired remedy. Ask at most 6 questions. Questions must be simple enough for a citizen.\n\nReturn ONLY JSON: {"questions":[{"id":"stable_short_id","question":"...","input_type":"text|number|date","required":true}]}\n\nDomain: ${domain}\nKnown facts: ${JSON.stringify(fields)}`,
      userPrompt: narrative, temperature: 0.15, maxTokens: 900,
    });
    const parsed = parseJson(raw);
    return Array.isArray(parsed.questions) ? parsed.questions.filter(q => q?.question).map((q, i) => ({
      field_key: String(q.id || `ai_question_${i + 1}`),
      question_text: String(q.question),
      input_type: ['text', 'number', 'date'].includes(q.input_type) ? q.input_type : 'text',
      ai_generated: true,
    })) : [];
  } catch (err) {
    console.warn('[Questioner] AI unavailable; using deterministic questions:', err.message);
    return clarifyingQuestions(domain, fields);
  }
}

function clarifyingQuestions(domain, fields) {
  const questions = {
    RTI: [['authority_name', 'Which department or public authority should receive the RTI application?', 'text'], ['information_requested', 'What exact information or records do you want from the authority?', 'text'], ['applicant_address', 'What address should be used for correspondence?', 'text']],
    Consumer: [['merchant_name', 'What is the seller, merchant, or service provider name?', 'text'], ['product_or_service', 'What product or service is involved?', 'text'], ['claim_amount', 'What was the purchase or claim amount?', 'number'], ['state', 'Which state should be used for the complaint?', 'text'], ['relief_sought', 'What outcome do you want?', 'text']],
  };
  return (questions[domain] || []).filter(([key]) => !fields || !fields[key]).map(([field_key, question_text, input_type]) => ({ field_key, question_text, input_type }));
}

module.exports = { extract, generateClarifyingQuestions, clarifyingQuestions, SCHEMAS };
