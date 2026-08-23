const { classify } = require('./classify');
const { extract, clarifyingQuestions } = require('./extract');

async function analyze(text) {
  const classification = await classify(text);
  if (classification.domain === 'Unsupported') {
    return { ...classification, extracted_fields: {}, clarifying_questions: [] };
  }
  const extracted_fields = extract(text, classification.domain);
  const clarifying_questions = clarifyingQuestions(classification.domain, extracted_fields);
  return { ...classification, extracted_fields, clarifying_questions };
}
module.exports = { analyze };
