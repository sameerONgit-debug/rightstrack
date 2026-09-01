const { classify } = require('./classify');
const { extract, generateClarifyingQuestions, clarifyingQuestions } = require('./extract');

async function analyze(text) {
  if (!text || !String(text).trim()) throw new Error('Analysis requires a non-empty problem narrative.');

  const narrative = String(text).trim();
  const classification = await classify(narrative);
  const extracted_fields = await extract(narrative, classification.domain);

  let clarifying_questions;
  try {
    clarifying_questions = await generateClarifyingQuestions({
      narrative,
      domain: classification.domain,
      fields: extracted_fields,
    });
  } catch (error) {
    // Question generation is an enhancement, not a reason to fail the whole
    // analysis. Keep classification/extraction available during provider
    // outages or malformed model JSON and clearly mark fallback questions.
    console.warn('[Analyzer] AI question generation failed; using deterministic questions:', error?.message || error);
    clarifying_questions = clarifyingQuestions(classification.domain, extracted_fields);
  }

  return {
    ...classification,
    extracted_fields,
    clarifying_questions,
    narrative,
    ai_pipeline: true,
  };
}

module.exports = { analyze };
