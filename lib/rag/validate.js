/** Deterministic grounding validator; generation never decides its own legal support. */
function normalize(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, ' '); }

function validateCitations(citations, retrievedChunks) {
  const chunks = Array.isArray(retrievedChunks) ? retrievedChunks : [];
  const byId = new Map(chunks.map(c => [normalize(c.chunk_id), c]));
  const bySection = new Map(chunks.map(c => [normalize(c.section_number || c.section), c]));
  return (Array.isArray(citations) ? citations : []).map(citation => {
    const chunk = citation.chunk_id ? byId.get(normalize(citation.chunk_id)) : bySection.get(normalize(citation.section_number || citation.section));
    const grounded = Boolean(chunk) && (!citation.act_name || normalize(citation.act_name) === normalize(chunk.act_name)) && (!citation.section_number || normalize(citation.section_number) === normalize(chunk.section_number || chunk.section));
    return { ...citation, grounded, chunk_id: chunk?.chunk_id || citation.chunk_id || null };
  });
}

function findReferencedSections(text) {
  const found = new Set();
  const regex = /\bsection\s+([0-9]+(?:\([a-z0-9]+\))?(?:\([a-z0-9]+\))?)/gi;
  let match;
  while ((match = regex.exec(String(text || '')))) found.add(`section ${match[1]}`.toLowerCase());
  return [...found];
}

function validateGeneratedText(text, retrievedChunks) {
  const chunks = Array.isArray(retrievedChunks) ? retrievedChunks : [];
  const allowedSections = new Set(chunks.map(c => normalize(c.section_number || c.section)));
  const referenced = findReferencedSections(text);
  const unsupported = referenced.filter(section => !allowedSections.has(section));
  return { grounded: unsupported.length === 0, referenced_sections: referenced, unsupported_sections: unsupported };
}

function validateResult(result, retrievedChunks) {
  const citations = validateCitations(result?.citations, retrievedChunks);
  const text = result?.document_text || result?.document?.content || result?.explanation_text || '';
  const textCheck = validateGeneratedText(text, retrievedChunks);
  const invalid = citations.filter(c => !c.grounded);
  const groundedCount = citations.filter(c => c.grounded).length;
  const total = citations.length;
  const insufficient = total === 0 || groundedCount === 0;
  return {
    ...result,
    citations,
    grounded: !insufficient && invalid.length === 0 && textCheck.grounded,
    insufficient_information: insufficient,
    grounding_summary: { total_citations: total, grounded_citations: groundedCount, ungrounded_citations: invalid.length, unsupported_sections: textCheck.unsupported_sections },
  };
}

module.exports = { validateCitations, validateGeneratedText, validateResult };
