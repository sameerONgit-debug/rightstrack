const { classify } = require('./classify');
const { extract, clarifyingQuestions } = require('./extract');

async function analyze(text) {
  if (!text || !String(text).trim()) {
    throw new Error('Analysis requires a non-empty problem narrative.');
  }

  const narrative = String(text).trim();
  const classification = await classify(narrative);

  if (classification.domain === 'Unsupported') {
    return {
      ...classification,
      extracted_fields: {},
      clarifying_questions: [],
      suggested_category: classification.suggested_category || '',
    };
  }

  const extracted_fields = await extract(narrative, classification.domain);
  const clarifying_questions = clarifyingQuestions(classification.domain, extracted_fields);

  return {
    ...classification,
    extracted_fields,
    clarifying_questions,
  };
}

module.exports = { analyze };
