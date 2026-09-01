const { classify, classifyHeuristic } = require('./classify');
const { extract, generateClarifyingQuestions, clarifyingQuestions, SCHEMAS } = require('./extract');

function emptyExtractedFields(domain) {
  return Object.fromEntries((SCHEMAS[domain] || SCHEMAS.Unsupported || []).map((key) => [key, null]));
}

async function analyze(text) {
  if (!text || !String(text).trim()) throw new Error('Analysis requires a non-empty problem narrative.');

  const narrative = String(text).trim();

  // Emergency fail-open behavior: AI enrichment is valuable, but it must never
  // block the citizen from continuing through the product when a provider is
  // unavailable, rate-limited, malformed, or temporarily overloaded.
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
    // extract.js intentionally keeps this fallback opt-in, but the top-level
    // analysis endpoint is fail-open so the user can still reach the next step.
    // Reuse the module's deterministic question/fallback behavior through the
    // public API by temporarily enabling it only for this local call.
    const previous = process.env.AI_ALLOW_FALLBACK;
    process.env.AI_ALLOW_FALLBACK = 'true';
    try {
      extracted_fields = await extract(narrative, classification.domain);
    } catch (fallbackError) {
      console.warn('[Analyzer] Deterministic extraction fallback failed; returning empty fields:', fallbackError?.message || fallbackError);
      extracted_fields = emptyExtractedFields(classification.domain);
    } finally {
      if (previous === undefined) delete process.env.AI_ALLOW_FALLBACK;
      else process.env.AI_ALLOW_FALLBACK = previous;
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

  const ai_pipeline = classificationAi || extractionAi || questionsAi;

  return {
    ...classification,
    extracted_fields,
    clarifying_questions,
    narrative,
    ai_pipeline,
    ai_generated: classification.ai_generated === true && classificationAi && extractionAi && questionsAi,
  };
}

module.exports = { analyze };
