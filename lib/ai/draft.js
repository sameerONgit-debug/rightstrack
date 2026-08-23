const { validateResult } = require('../rag/validate');

function parseJson(raw) {
  const text = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI returned no JSON object.');
  return JSON.parse(text.slice(start, end + 1));
}

function fallbackDraft({ domain, fields = {}, retrievedChunks = [], narrative = '', answers = {} }) {
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
      explanation_text: 'Draft prepared from the facts supplied by the applicant. Legal citations are shown only when supported by the retrieved legal corpus.',
      document_text: `To,\nThe Public Information Officer\n${f.authority_name || '[Public Authority]'}\n\nSubject: Request for information under the Right to Information Act, 2005\n\nRespected Sir/Madam,\n\nI, ${f.applicant_name || '[Applicant name]'}, request the following information/records: ${f.information_requested || '[Information requested]'}.\n\nBackground / facts:\n${narrative || '[Please provide the relevant facts]'}\n\nI request that the above information be provided in the prescribed manner.\n\nApplicant: ${f.applicant_name || '[Applicant name]'}\nAddress: ${f.applicant_address || '[Applicant address]'}\nContact: ${f.contact || '[Contact details]'}\n\nDate: ${f.date || '[Date]'}\nPlace: ${f.place || '[Place]'}\n\nSignature: __________________\n${f.applicant_name || '[Applicant name]'}`,
      citations: sourceCitations,
      missing_information: [
        ...(!f.applicant_name ? ['Applicant name'] : []),
        ...(!f.applicant_address ? ['Applicant address'] : []),
        ...(!f.authority_name ? ['Public authority / PIO details'] : []),
        ...(!f.information_requested ? ['Specific information requested'] : []),
      ],
    };
  }

  if (domain === 'Consumer') {
    return {
      title: 'Consumer Complaint',
      authority_recipient: 'District Consumer Disputes Redressal Commission',
      explanation_text: 'Draft prepared from the facts supplied by the complainant. Legal citations are shown only when supported by the retrieved legal corpus.',
      document_text: `Before the District Consumer Disputes Redressal Commission\n\nSubject: Consumer complaint regarding ${f.product_or_service || '[product/service]'}\n\nThe complainant states:\n${narrative || '[Describe the dispute and relevant facts]'}\n\nThe deficiency / defect complained of is: ${f.issue || '[Describe the defect or deficiency]'}\n\nRelief sought: ${f.relief_sought || '[Requested remedy]'}\n\nTransaction amount: ${f.claim_amount ? `₹${f.claim_amount}` : '[Amount]'}\n\nComplainant: ${f.applicant_name || '[Applicant name]'}\nAddress: ${f.applicant_address || '[Applicant address]'}\nState: ${f.state || '[State]'}\n\nDate: ${f.date || '[Date]'}\nPlace: ${f.place || '[Place]'}\n\nSignature: __________________\n${f.applicant_name || '[Applicant name]'}`,
      citations: sourceCitations,
      missing_information: [
        ...(!f.applicant_name ? ['Complainant name'] : []),
        ...(!f.applicant_address ? ['Complainant address'] : []),
        ...(!f.issue ? ['Specific defect / deficiency'] : []),
        ...(!f.relief_sought ? ['Relief sought'] : []),
      ],
    };
  }

  return { title: 'Legal Document', authority_recipient: 'Competent Authority', explanation_text: 'This category is not currently covered by the grounded legal corpus.', document_text: '', citations: [], missing_information: [] };
}

async function qualityReview(result, { domain, narrative, fields, answers, retrievedChunks }) {
  try {
    const { callClaude } = await import('./claude.js');
    const review = await callClaude({
      systemPrompt: `You are the final quality reviewer for a civic/legal AI document. Check the proposed draft against the user's actual case. Do not rewrite it. Identify factual inventions, missing critical information, unsupported legal claims, and contradictions. Legal support is separately checked against retrieved source IDs, so focus on whether the draft faithfully represents the case. Return ONLY JSON: {"approved":true|false,"issues":["..."],"missing_information":["..."]}`,
      userPrompt: JSON.stringify({ domain, narrative, fields, answers, draft: result.document_text, citations: result.citations, retrieved_sources: retrievedChunks.map(c => ({ chunk_id: c.chunk_id, act_name: c.act_name, section_number: c.section_number || c.section })) }),
      temperature: 0,
      maxTokens: 900,
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

async function buildDraft({ domain, fields = {}, retrievedChunks = [], narrative = '', answers = {} }) {
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
      systemPrompt: `You are RightsTrack's legal drafting AI. Draft a useful Indian civic/legal document from the user's actual case, not from a fixed template.\n\nRules:\n1. Use the user's actual narrative, extracted fields and answers as the primary source of facts. Never invent names, dates, amounts, events or evidence.\n2. Adapt the structure and wording to the actual dispute. Do not force irrelevant fields into the document.\n3. Keep the tone formal, clear and filing-ready.\n4. If a legally important fact is missing, mark it as [NEEDS USER INPUT] rather than guessing.\n5. ${hasLegalSources ? 'Use the retrieved legal sources as the ONLY basis for legal provisions and citations. Never invent a section number.' : 'No verified legal source was retrieved for this request. You may draft the factual/formal document structure, but DO NOT invent section numbers, case law, statutory quotations or legal citations. Explicitly indicate in explanation_text that legal citations still need verification.'}\n6. Return ONLY JSON: {"title":"...","authority_recipient":"...","explanation_text":"...","document_text":"...","citations":[],"missing_information":["..."]}`,
      userPrompt: JSON.stringify({ domain, narrative, extracted_fields: fields, answers, retrieved_legal_sources: sourcePack }),
      temperature: 0.1,
      maxTokens: 3200,
    });

    const result = parseJson(raw);
    const reviewed = await qualityReview(result, { domain, narrative, fields, answers, retrievedChunks });
    return validateResult(reviewed, retrievedChunks);
  } catch (err) {
    console.warn('[Drafter] AI drafting unavailable; using deterministic fallback:', err.message);
    return validateResult(fallbackDraft({ domain, fields, retrievedChunks, narrative, answers }), retrievedChunks);
  }
}

module.exports = { buildDraft };
