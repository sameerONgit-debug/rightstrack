const { classify, classifyHeuristic } = require('./classify');
const { extract, generateClarifyingQuestions, clarifyingQuestions, heuristicExtract, SCHEMAS } = require('./extract');

function emptyExtractedFields(domain) {
  return Object.fromEntries((SCHEMAS[domain] || SCHEMAS.Unsupported || []).map((key) => [key, null]));
}

async function analyze(text) {
  if (!text || !String(text).trim()) throw new Error('Analysis requires a non-empty problem narrative.');

  const narrative = String(text).trim();

  // Emergency fail-open behavior: AI enrichment is valuable, but it must never
  // block the citizen from continuing when a provider is unavailable,
  // rate-limited, malformed, or temporarily overloaded.
  let classification;
  let classificationAi = true;
  try {
    classification = await classify(narrative);
  } catch (error) {
    console.warn('[Analyzer] AI classification failed; using deterministic fallback:', error?.message || error);
    classification = classifyHeuristic(narrative);
    classificationAi = false;
  }

  let extracted_fields;
  let extractionAi = true;
  try {
    extracted_fields = await extract(narrative, classification.domain);
  } catch (error) {
    console.warn('[Analyzer] AI extraction failed; using deterministic fallback:', error?.message || error);
    const extractionDomain = SCHEMAS[classification.domain] ? classification.domain : 'Unsupported';
    try {
      extracted_fields = heuristicExtract(narrative, extractionDomain);
    } catch (fallbackError) {
      console.warn('[Analyzer] Deterministic extraction fallback failed; returning empty fields:', fallbackError?.message || fallbackError);
      extracted_fields = emptyExtractedFields(extractionDomain);
    }
    extractionAi = false;
  }

  let clarifying_questions;
  let questionsAi = true;
  try {
    clarifying_questions = await generateClarifyingQuestions({
      narrative,
      domain: classification.domain,
      fields: extracted_fields,
    });
  } catch (error) {
    console.warn('[Analyzer] AI question generation failed; using deterministic questions:', error?.message || error);
    clarifying_questions = clarifyingQuestions(classification.domain, extracted_fields);
    questionsAi = false;
  }

  return {
    ...classification,
    extracted_fields,
    clarifying_questions,
    narrative,
    ai_pipeline: classificationAi || extractionAi || questionsAi,
    ai_generated: classification.ai_generated === true && classificationAi && extractionAi && questionsAi,
  };
}

module.exports = { analyze };
