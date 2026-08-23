const { classify } = require('./classify');
const { extract, generateClarifyingQuestions } = require('./extract');

async function analyze(text) {
  if (!text || !String(text).trim()) throw new Error('Analysis requires a non-empty problem narrative.');

  const narrative = String(text).trim();
  const classification = await classify(narrative);
  const extracted_fields = await extract(narrative, classification.domain);
  const clarifying_questions = await generateClarifyingQuestions({
    narrative,
    domain: classification.domain,
    fields: extracted_fields,
  });

  return {
    ...classification,
    extracted_fields,
    clarifying_questions,
    narrative,
    ai_pipeline: true,
  };
}

module.exports = { analyze };
