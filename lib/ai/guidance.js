/**
 * RightsTrack case guidance layer.
 *
 * Classification says what the matter appears to be. This layer turns the
 * complete case into actionable, jurisdiction-aware guidance. Gemini is the
 * active provider through the shared AI service.
 */

function parseJson(raw) {
  const text = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI returned no JSON object.');
  return JSON.parse(text.slice(start, end + 1));
}

const VERIFIED_REFERENCE_PACK = [
  {
    topic: 'employment / unpaid wages',
    sources: [
      { name: 'SAMADHAN — Ministry of Labour & Employment', url: 'https://samadhan.labour.gov.in/', fact: 'The Ministry of Labour & Employment describes SAMADHAN as a platform for employment grievances, industrial disputes and claims. Its current FAQ lists delay/non-payment of wages and related claims.' },
      { name: 'SAMADHAN FAQ — Acts and Rules', url: 'https://samadhan.labour.gov.in/Faqs/acts_and_rules', fact: 'The official FAQ maps non-payment/unauthorised deductions and other wage issues to applicable labour-law claim routes.' },
      { name: 'Ministry of Labour & Employment — Labour Codes', url: 'https://www.labour.gov.in/offerings/schemes-and-services/details/labour-codes-gNzQzQ', fact: 'The Ministry publishes the Code on Wages, 2019 and current rules/notifications. Applicability depends on the worker, establishment and jurisdiction.' }
    ]
  }
];

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeSourceList(sources, allowedUrls) {
  if (!Array.isArray(sources)) return [];
  return sources.filter((source) => {
    const url = String(source?.url || '').trim();
    return url && allowedUrls.has(url);
  }).map((source) => ({
    name: String(source.name || 'Official source'),
    url: String(source.url),
    why: String(source.why || ''),
  }));
}

function normalizeAuthorities(authorities) {
  if (!Array.isArray(authorities)) return [];
  return authorities.filter(Boolean).slice(0, 5).map((item) => ({
    authority: String(item.authority || ''),
    role: String(item.role || ''),
    jurisdiction_needed: String(item.jurisdiction_needed || ''),
    location: String(item.location || ''),
  })).filter((item) => item.authority || item.role);
}

function normalizeLegalIssues(issues) {
  if (!Array.isArray(issues)) return [];
  return issues.filter(Boolean).slice(0, 8).map((item) => ({
    issue: String(item.issue || ''),
    status: ['confirmed', 'possible', 'needs_more_facts'].includes(item.status) ? item.status : 'needs_more_facts',
    explanation: String(item.explanation || ''),
    legal_basis: String(item.legal_basis || ''),
  })).filter((item) => item.issue || item.explanation);
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
  const allowedUrls = new Set([
    ...relevantReferencePack.flatMap((pack) => pack.sources.map((source) => source.url)),
    ...retrieved.map((source) => source.url).filter(Boolean),
  ]);

  const raw = await callClaude({
    systemPrompt: `You are RightsTrack's case-specific legal and civic guidance AI for India. Understand the complete case, not just its category, and produce useful next actions for THIS person.

Rules:
1. Identify the actual issue from actors, events, chronology, harm and desired outcome.
2. Separate confirmed legal applicability from possibilities that require more facts.
3. Identify the responsible authority/channel and explain why it is responsible.
4. Never invent a local office, address, phone number, jurisdiction or government portal. If jurisdiction is unknown, say exactly what location information is needed.
5. Give a practical ordered action plan, evidence checklist and escalation path.
6. Use statutory section numbers/case law only when supported by the supplied verified references or retrieved legal sources. Otherwise state that the provision needs verification.
7. Official source URLs may be selected ONLY from the supplied references/retrieval context.
8. Never force an unrelated grievance into RTI or Consumer.
9. For employment/wage matters, use the supplied official SAMADHAN/Ministry references and distinguish employment-law routes from generic public-grievance channels.
10. Preserve the user's facts; never invent missing names, dates, amounts or events.

Return ONLY JSON:
{
  "summary":"plain-language understanding",
  "legal_issues":[{"issue":"...","status":"confirmed|possible|needs_more_facts","explanation":"...","legal_basis":"..."}],
  "responsible_authorities":[{"authority":"...","role":"...","jurisdiction_needed":"...","location":""}],
  "action_steps":["..."],
  "evidence":["..."],
  "escalation":["..."],
  "missing_information":["..."],
  "official_sources":[{"name":"...","url":"ONLY supplied URL","why":"..."}],
  "disclaimer":"..."
}`,
    userPrompt: JSON.stringify({ narrative, domain, ai_generated_category: category || '', extracted_fields: fields || {}, user_answers: answers || {}, retrieved_legal_sources: retrieved, verified_reference_pack: relevantReferencePack }),
    temperature: 0.1,
    maxTokens: 3000,
  });

  const result = parseJson(raw);
  const guidance = {
    summary: String(result.summary || ''),
    legal_issues: normalizeLegalIssues(result.legal_issues),
    responsible_authorities: normalizeAuthorities(result.responsible_authorities),
    action_steps: safeArray(result.action_steps).map(String).slice(0, 10),
    evidence: safeArray(result.evidence).map(String).slice(0, 12),
    escalation: safeArray(result.escalation).map(String).slice(0, 8),
    missing_information: safeArray(result.missing_information).map(String).slice(0, 10),
    official_sources: normalizeSourceList(result.official_sources, allowedUrls),
    disclaimer: String(result.disclaimer || 'This guidance is informational and should be verified before filing.'),
  };

  // A second AI pass checks the actual case/guidance relationship. It does not
  // rewrite the answer; it only identifies unsafe assumptions and missing facts.
  try {
    const reviewRaw = await callClaude({
      systemPrompt: `You are RightsTrack's safety and relevance reviewer. Review the proposed guidance against the COMPLETE citizen narrative. Reject only if the guidance materially misidentifies the grievance, invents facts/authority/location, makes an unsupported legal claim, or omits a critical fact needed before filing. Return ONLY JSON: {"approved":true|false,"issues":["..."],"missing_information":["..."]}`,
      userPrompt: JSON.stringify({ narrative, domain, category, fields, answers, guidance }),
      temperature: 0,
      maxTokens: 900,
    });
    const review = parseJson(reviewRaw);
    guidance.ai_review = {
      approved: review?.approved !== false,
      issues: safeArray(review?.issues).map(String).slice(0, 8),
    };
    guidance.missing_information = [...new Set([
      ...guidance.missing_information,
      ...safeArray(review?.missing_information).map(String),
    ])].slice(0, 12);
  } catch (err) {
    console.warn('[Guidance] Quality review unavailable; preserving primary guidance:', err?.message || err);
  }

  return guidance;
}

module.exports = { generateGuidance, VERIFIED_REFERENCE_PACK };
