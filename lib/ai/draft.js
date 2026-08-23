const { validateResult } = require('../rag/validate');

function parseJson(raw) {
  const text = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI returned no JSON object.');
  return JSON.parse(text.slice(start, end + 1));
}

function fallbackDraft({ domain, fields = [], retrievedChunks = [] }) {
  if (!retrievedChunks.length) return { explanation_text: 'No sufficiently relevant provision was retrieved from the supported legal corpus. A grounded document was not generated.', document_text: '', citations: [], insufficient_information: true };
  const f = fields || {};
  if (domain === 'RTI') {
    return { explanation_text: 'Draft based only on supplied facts and retrieved RTI provisions.', document_text: `To,\nThe Public Information Officer\n${f.authority_name || '[Public Authority]'}\n\nSubject: Request for information under the Right to Information Act, 2005\n\nI request the following information: ${f.information_requested || '[Information requested]'}.\n\nApplicant: ${f.applicant_name || '[Applicant name]'}\nAddress: ${f.applicant_address || '[Applicant address]'}\n\nSignature: __________________`, citations: retrievedChunks.slice(0, 3).map(c => ({ chunk_id: c.chunk_id, act_name: c.act_name, section_number: c.section_number || c.section })) };
  }
  if (domain === 'Consumer') {
    return { explanation_text: 'Draft based only on supplied facts and retrieved Consumer Protection provisions.', document_text: `To,\nThe District Consumer Disputes Redressal Commission\n\nSubject: Consumer complaint regarding ${f.product_or_service || '[product/service]'}\n\nThe complainant states that ${f.issue || '[describe the defect or deficiency]'}. Transaction amount: ${f.claim_amount ? `₹${f.claim_amount}` : '[amount]'}. Relief sought: ${f.relief_sought || '[requested remedy]'}.\n\nComplainant: ${f.applicant_name || '[Applicant name]'}\nState: ${f.state || '[State]'}\n\nSignature: __________________`, citations: retrievedChunks.slice(0, 3).map(c => ({ chunk_id: c.chunk_id, act_name: c.act_name, section_number: c.section_number || c.section })) };
  }
  return { explanation_text: 'This category is not currently covered by the grounded legal corpus.', document_text: '', citations: [], insufficient_information: true };
}

async function buildDraft({ domain, fields = {}, retrievedChunks = [], narrative = '', answers = {} }) {
  if (!retrievedChunks.length) return fallbackDraft({ domain, fields, retrievedChunks });

  try {
    const { callClaude } = await import('./claude.js');
    const sourcePack = retrievedChunks.map((c, i) => ({
      source_index: i + 1,
      chunk_id: c.chunk_id,
      act_name: c.act_name,
      section_number: c.section_number || c.section,
      section_title: c.section_title || c.title,
      text: c.content || c.text || c.chunk_text,
    }));

    const raw = await callClaude({
      systemPrompt: `You are RightsTrack's legal drafting AI. Draft a useful Indian civic/legal document from the user's actual case, not from a template.\n\nRules:\n1. Use only facts supplied in the narrative, extracted fields and answers. Never invent names, dates, amounts, events or evidence.\n2. Use the retrieved legal sources as the ONLY basis for legal provisions. Do not invent sections or citations.\n3. If a legally important fact is missing, clearly mark it as [NEEDS USER INPUT] rather than guessing.\n4. Adapt the document structure and wording to the actual dispute.\n5. Keep the tone formal, clear and filing-ready.\n6. Return ONLY JSON: {"title":"...","authority_recipient":"...","explanation_text":"...","document_text":"...","citations":[{"chunk_id":"...","act_name":"...","section_number":"...","section_title":"..."}],"missing_information":["..."]}`,
      userPrompt: JSON.stringify({ domain, narrative, extracted_fields: fields, answers, retrieved_legal_sources: sourcePack }),
      temperature: 0.1,
      maxTokens: 2600,
    });

    const result = parseJson(raw);
    return validateResult(result, retrievedChunks);
  } catch (err) {
    console.warn('[Drafter] AI drafting unavailable; using grounded deterministic fallback:', err.message);
    return validateResult(fallbackDraft({ domain, fields, retrievedChunks }), retrievedChunks);
  }
}

module.exports = { buildDraft };
