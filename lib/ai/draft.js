const { validateResult } = require('../rag/validate');

function parseJson(raw) {
  const text = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI returned no JSON object.');
  return JSON.parse(text.slice(start, end + 1));
}

function listSection(heading, items) {
  if (!Array.isArray(items) || !items.length) return null;
  return { heading, content: items.map((item, index) => `${index + 1}. ${typeof item === 'string' ? item : JSON.stringify(item)}`).join('\n') };
}

function guidanceSections(guidance) {
  const sections = [];
  if (guidance?.summary) sections.push({ heading: 'What RightsTrack understood', content: guidance.summary });
  const legal = (guidance?.legal_issues || []).map((item) => `${item.issue}: ${item.explanation}${item.legal_basis ? `\nLegal basis: ${item.legal_basis}` : ''}`);
  const legalSection = listSection('Potential legal protections', legal);
  if (legalSection) sections.push(legalSection);
  const authorities = (guidance?.responsible_authorities || []).map((item) => `${item.authority} — ${item.role}${item.jurisdiction_needed ? `\nJurisdiction: ${item.jurisdiction_needed}` : ''}${item.location ? `\nLocation: ${item.location}` : ''}`);
  const authoritySection = listSection('Responsible authority / where to reach', authorities);
  if (authoritySection) sections.push(authoritySection);
  const steps = listSection('What to do next', guidance?.action_steps);
  if (steps) sections.push(steps);
  const evidence = listSection('Evidence to keep', guidance?.evidence);
  if (evidence) sections.push(evidence);
  const escalation = listSection('If the first step does not work', guidance?.escalation);
  if (escalation) sections.push(escalation);
  const missing = listSection('Information still needed', guidance?.missing_information);
  if (missing) sections.push(missing);
  const sources = (guidance?.official_sources || []).map((source) => `${source.name}${source.why ? ` — ${source.why}` : ''}\n${source.url || ''}`);
  const sourceSection = listSection('Official sources / portals', sources);
  if (sourceSection) sections.push(sourceSection);
  return sections;
}

function fallbackDraft({ domain, fields = {}, retrievedChunks = [], narrative = '', guidance = {} }) {
  const f = fields || {};
  const sourceCitations = retrievedChunks.slice(0, 3).map(c => ({
    chunk_id: c.chunk_id,
    act_name: c.act_name,
    section_number: c.section_number || c.section,
    section_title: c.section_title || c.title,
  }));

  if (domain === 'RTI') {
    return {
      title: 'RTI Application',
      authority_recipient: f.authority_name || 'Public Information Officer',
      explanation_text: 'Draft prepared from the citizen\'s actual narrative and available legal sources.',
      document_text: `To,\nThe Public Information Officer\n${f.authority_name || '[Public Authority]'}\n\nSubject: Request for information under the Right to Information Act, 2005\n\nRespected Sir/Madam,\n\nI, ${f.applicant_name || '[Applicant name]'}, request the following information/records: ${f.information_requested || '[Information requested]'}.\n\nBackground / facts:\n${narrative}\n\nApplicant: ${f.applicant_name || '[Applicant name]'}\nAddress: ${f.applicant_address || '[Applicant address]'}\n\nDate: [Date]\nSignature: __________________`,
      citations: sourceCitations,
      missing_information: guidance.missing_information || [],
      guidance,
      sections: guidanceSections(guidance),
    };
  }

  if (domain === 'Consumer') {
    return {
      title: 'Consumer Complaint',
      authority_recipient: 'Appropriate Consumer Disputes Redressal Commission / Authority',
      explanation_text: 'Draft prepared from the citizen\'s actual narrative and available legal sources.',
      document_text: `Before the appropriate Consumer Disputes Redressal Commission / Authority\n\nSubject: Complaint regarding ${f.product_or_service || '[product/service]'}\n\nThe complainant states:\n${narrative}\n\nIssue: ${f.issue || '[Describe the issue]'}\nRelief sought: ${f.relief_sought || '[Requested remedy]'}\n\nComplainant: ${f.applicant_name || '[Applicant name]'}\nAddress: ${f.applicant_address || '[Applicant address]'}\nState/District: ${f.state || '[State]'} / ${f.district || '[District]'}\n\nDate: [Date]\nSignature: __________________`,
      citations: sourceCitations,
      missing_information: guidance.missing_information || [],
      guidance,
      sections: guidanceSections(guidance),
    };
  }

  return {
    title: guidance?.summary ? 'Personalized Legal & Civic Guidance' : 'Legal / Civic Grievance',
    authority_recipient: guidance?.responsible_authorities?.[0]?.authority || 'Authority to be confirmed from jurisdiction',
    explanation_text: guidance?.disclaimer || 'This guidance is informational. Verify the applicable law and local authority before filing.',
    document_text: `Subject: Grievance regarding ${f.issue || 'the reported matter'}\n\nFacts reported by the citizen:\n${narrative}\n\nRequested outcome: ${f.relief_sought || '[NEEDS USER INPUT]'}\n\nApplicant: ${f.applicant_name || '[Applicant name]'}\nAddress: ${f.applicant_address || '[Applicant address]'}\nState/District: ${f.state || '[State]'} / ${f.district || '[District]'}\n\nDate: [Date]\nSignature: __________________`,
    citations: [],
    missing_information: guidance?.missing_information || [],
    guidance,
    sections: guidanceSections(guidance),
  };
}

function hasUsableDraft(result) {
  return Boolean(result && typeof result.document_text === 'string' && result.document_text.trim().length >= 40);
}

async function qualityReview(result, { domain, narrative, fields, answers, retrievedChunks, guidance }) {
  try {
    const { callClaude } = await import('./claude.js');
    const review = await callClaude({
      systemPrompt: `You are the final quality reviewer for a civic/legal AI case. Check the proposed guidance and document against the user's actual case. Do not rewrite it. Identify factual inventions, missing critical information, unsupported legal claims, wrong authority assumptions, jurisdiction errors, and contradictions. Do not reject a useful procedural suggestion merely because a local office still needs the user's location. Return ONLY JSON: {"approved":true|false,"issues":["..."],"missing_information":["..."]}`,
      userPrompt: JSON.stringify({ domain, narrative, fields, answers, guidance, draft: result.document_text, citations: result.citations, retrieved_sources: retrievedChunks.map(c => ({ chunk_id: c.chunk_id, act_name: c.act_name, section_number: c.section_number || c.section })) }),
      temperature: 0,
      maxTokens: 1000,
    });
    const parsed = parseJson(review);
    return {
      ...result,
      ai_review: parsed,
      missing_information: [...new Set([...(result.missing_information || []), ...(parsed.missing_information || [])])],
    };
  } catch (err) {
    console.warn('[Drafter] AI quality review unavailable:', err.message);
    return result;
  }
}

async function buildDraft({ domain, category = '', fields = {}, retrievedChunks = [], narrative = '', answers = {} }) {
  const { generateGuidance } = require('./guidance');
  let guidance = {};

  try {
    guidance = await generateGuidance({
      narrative: String(narrative || '').trim(),
      domain,
      category: category || (domain === 'Unsupported' ? 'AI-generated grievance category' : domain),
      fields,
      answers,
      retrievedChunks,
    });
  } catch (err) {
    console.warn('[Guidance] AI guidance unavailable:', err.message);
  }

  try {
    const { callClaude } = await import('./claude.js');
    const hasLegalSources = retrievedChunks.length > 0;
    const sourcePack = retrievedChunks.map((c, i) => ({
      source_index: i + 1,
      chunk_id: c.chunk_id,
      act_name: c.act_name,
      section_number: c.section_number || c.section,
      section_title: c.section_title || c.title,
      text: c.content || c.text || c.chunk_text,
    }));

    const raw = await callClaude({
      systemPrompt: `You are RightsTrack's final legal-document drafting AI. Generate a document tailored to the citizen's actual case. The guidance object is an analysis aid, not a source of facts.\n\nRules:\n1. Use the original narrative, extracted facts and user answers as the primary source of facts. Never invent names, dates, amounts, events, evidence or locations.\n2. Adapt the document to the actual dispute. Do not force RTI/Consumer structure onto an unrelated grievance.\n3. Keep the tone formal, clear and filing-ready.\n4. Mark legally important missing facts as [NEEDS USER INPUT].\n5. ${hasLegalSources ? 'Use retrieved legal sources as the only basis for statutory section numbers/citations.' : 'No verified legal corpus was retrieved. Do not invent section numbers, statutory quotations or case law.'}\n6. Return JSON: {"title":"...","authority_recipient":"...","explanation_text":"...","document_text":"...","citations":[],"missing_information":["..."]}`,
      userPrompt: JSON.stringify({ domain, category, narrative, extracted_fields: fields, answers, guidance, retrieved_legal_sources: sourcePack }),
      temperature: 0.1,
      maxTokens: 3600,
    });

    const result = parseJson(raw);
    if (!hasUsableDraft(result)) {
      throw new Error('AI returned an empty or unusable document draft.');
    }

    const reviewed = await qualityReview(result, { domain, narrative, fields, answers, retrievedChunks, guidance });
    const finalResult = validateResult({ ...reviewed, guidance, sections: guidanceSections(guidance) }, retrievedChunks);
    if (!hasUsableDraft(finalResult)) {
      throw new Error('AI document failed final validation.');
    }
    return finalResult;
  } catch (err) {
    console.warn('[Drafter] AI drafting unavailable; using deterministic fallback:', err.message);
    return validateResult(fallbackDraft({ domain, fields, retrievedChunks, narrative, guidance }), retrievedChunks);
  }
}

module.exports = { buildDraft };
