/**
 * RightsTrack case guidance layer.
 *
 * This is deliberately separate from classification. Classification answers
 * "what kind of matter is this?"; guidance answers "what can this person do
 * next?" using the full narrative, extracted facts, answers and verified
 * retrieval context.
 */

function parseJson(raw) {
  const text = String(raw || '').trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI returned no JSON object.');
  return JSON.parse(text.slice(start, end + 1));
}

const VERIFIED_REFERENCE_PACK = [
  {
    topic: 'employment / unpaid wages',
    sources: [
      {
        name: 'SAMADHAN — Ministry of Labour & Employment',
        url: 'https://samadhan.labour.gov.in/',
        fact: 'The Ministry of Labour & Employment describes SAMADHAN as a platform for employment grievances, industrial disputes and claims. Its current FAQ specifically lists delay/non-payment of wages and related claims and identifies applicable labour-law routes.'
      },
      {
        name: 'SAMADHAN FAQ — Acts and Rules',
        url: 'https://samadhan.labour.gov.in/Faqs/acts_and_rules',
        fact: 'The official FAQ maps non-payment/unauthorised deductions and other wage issues to the applicable labour-law claim routes, and lists gratuity, maternity, minimum-wage and industrial-dispute routes.'
      },
      {
        name: 'Ministry of Labour & Employment — Labour Codes',
        url: 'https://www.labour.gov.in/offerings/schemes-and-services/details/labour-codes-gNzQzQ',
        fact: 'The Ministry publishes the Code on Wages, 2019 and current Central Rules/notifications and FAQs. The applicable legal framework depends on the worker, establishment and jurisdiction.'
      }
    ]
  }
];

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

async function generateGuidance({ narrative, domain, category, fields, answers, retrievedChunks = [] }) {
  const { callClaude } = await import('./claude.js');

  const retrieved = retrievedChunks.map((chunk, index) => ({
    source_index: index + 1,
    chunk_id: chunk.chunk_id,
    act_name: chunk.act_name,
    section_number: chunk.section_number || chunk.section,
    section_title: chunk.section_title || chunk.title,
    text: chunk.content || chunk.text || chunk.chunk_text,
  }));

  const relevantReferencePack = VERIFIED_REFERENCE_PACK.filter((pack) => {
    const haystack = `${category || ''} ${domain || ''} ${narrative || ''}`.toLowerCase();
    return pack.topic.split('/').some((term) => haystack.includes(term.trim()));
  });

  const raw = await callClaude({
    systemPrompt: `You are RightsTrack's case-specific legal and civic guidance AI for India.

Your job is NOT merely to classify a grievance. Understand the complete situation and produce an actionable guidance plan for THIS person.

You must:
1. Identify the likely legal/civic issue(s) from facts, actors, harm, chronology and desired outcome.
2. Explain which legal protections or statutory mechanisms may apply. Distinguish confirmed applicability from possibilities that depend on missing facts.
3. Identify the responsible authority or channel and explain why it is responsible.
4. Identify jurisdiction information still needed (state, district, employer location, public authority, etc.). Never invent a local office, address, phone number or jurisdiction.
5. Give a practical ordered action plan.
6. List evidence/documents the person should preserve.
7. Explain escalation options if the first route fails.
8. Provide official source links only from the supplied verified references or retrieved legal sources.
9. If the case is outside the verified legal corpus, still give useful procedural guidance, but explicitly mark legal provisions that need verification. Do not fabricate section numbers or case law.
10. Do not force the case into RTI or Consumer. The AI-generated category may be any useful plain-language category.

For employment/wage matters, use the supplied official SAMADHAN/Ministry reference pack. Do not incorrectly tell private employees to use a public-grievance portal merely because it exists.

Return ONLY valid JSON:
{
  "summary": "plain-language understanding of the case",
  "legal_issues": [{"issue":"...","status":"confirmed|possible|needs_more_facts","explanation":"...","legal_basis":"..."}],
  "responsible_authorities": [{"authority":"...","role":"...","jurisdiction_needed":"...","location":"ONLY if explicitly supported by facts or verified source; otherwise empty string"}],
  "action_steps": ["..."],
  "evidence": ["..."],
  "escalation": ["..."],
  "missing_information": ["..."],
  "official_sources": [{"name":"...","url":"...","why":"..."}],
  "disclaimer":"..."
}`,
    userPrompt: JSON.stringify({
      narrative,
      domain,
      ai_generated_category: category || '',
      extracted_fields: fields || {},
      user_answers: answers || {},
      retrieved_legal_sources: retrieved,
      verified_reference_pack: relevantReferencePack,
    }),
    temperature: 0.1,
    maxTokens: 3000,
  });

  const result = parseJson(raw);
  return {
    summary: String(result.summary || ''),
    legal_issues: Array.isArray(result.legal_issues) ? result.legal_issues : [],
    responsible_authorities: Array.isArray(result.responsible_authorities) ? result.responsible_authorities : [],
    action_steps: safeArray(result.action_steps),
    evidence: safeArray(result.evidence),
    escalation: safeArray(result.escalation),
    missing_information: safeArray(result.missing_information),
    official_sources: Array.isArray(result.official_sources) ? result.official_sources : [],
    disclaimer: String(result.disclaimer || 'This guidance is informational and should be verified before filing.'),
  };
}

module.exports = { generateGuidance, VERIFIED_REFERENCE_PACK };
