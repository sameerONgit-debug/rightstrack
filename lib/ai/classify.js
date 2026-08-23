/** RightsTrack Member 3: domain classification. */

const DOMAINS = ['RTI', 'Consumer', 'Unsupported'];

function classifyHeuristic(text) {
  const value = String(text || '').toLowerCase();
  const rti = /\brti\b|right to information|public information|pio|public authority|government office|subsidy|scheme|official records|status of (my|the) application|block office|municipal/i.test(value);
  const consumer = /refund|return|seller|merchant|invoice|order|purchase|bought|defective|damaged|warranty|delivery|consumer|product|service provider|compensation/i.test(value);
  if (rti && !consumer) return { domain: 'RTI', confidence: 0.9, rationale: 'The situation concerns obtaining information or records from a public authority or government office.' };
  if (consumer && !rti) return { domain: 'Consumer', confidence: 0.9, rationale: 'The situation concerns defective goods, deficient services, a refund, or another consumer transaction dispute.' };
  if (rti && consumer) return { domain: 'RTI', confidence: 0.62, rationale: 'The situation contains both government-information and transaction language; user confirmation is required before proceeding.' };
  return { domain: 'Unsupported', confidence: 0.98, rationale: 'The issue does not clearly match the RTI or Consumer domains covered by the MVP corpus.' };
}

async function classify(text) {
  if (!text || !String(text).trim()) throw new Error('Classification requires non-empty text.');
  const result = classifyHeuristic(text);
  if (!DOMAINS.includes(result.domain)) throw new Error('Invalid classification domain.');
  return result;
}

module.exports = { classify, classifyHeuristic, DOMAINS };
