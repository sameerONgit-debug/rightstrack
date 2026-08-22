/**
 * Deterministic grounding validator.
 * The LLM is never trusted to establish whether a citation is valid.
 */

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function validateCitations(citations, retrievedChunks) {
  const chunks = Array.isArray(retrievedChunks) ? retrievedChunks : [];
  const byId = new Map(chunks.map(c => [normalize(c.chunk_id), c]));
  const bySection = new Map(chunks.map(c => [normalize(c.section_number || c.section), c]));
  const byAct = new Map(chunks.map(c => [normalize(c.act_name), c]));

  const validated = (Array.isArray(citations) ? citations : []).map(citation => {
    const chunk = citation.chunk_id ? byId.get(normalize(citation.chunk_id)) : bySection.get(normalize(citation.section_number || citation.section)) || byAct.get(normalize(citation.act_name));
    const grounded = Boolean(chunk) && (!citation.act_name || normalize(citation.act_name) === normalize(chunk.act_name)) && (!citation.section_number || normalize(citation.section_number) === normalize(chunk.section_number || chunk.section));
    return { ...citation, grounded, chunk_id: chunk?.chunk_id || citation.chunk_id || null };
  });
  return validated;
}

function validateResult(result, retrievedChunks) {
  const citations = validateCitations(result?.citations, retrievedChunks);
  const invalid = citations.filter(c => !c.grounded);
  const groundedCount = citations.filter(c => c.grounded).length;
  const total = citations.length;
  const insufficient = total > 0 ? groundedCount === 0 : true;
  return {
    ...result,
    citations,
    grounded: !insufficient && invalid.length === 0,
    insufficient_information: insufficient,
    grounding_summary: { total_citations: total, grounded_citations: groundedCount, ungrounded_citations: invalid.length },
  };
}

module.exports = { validateCitations, validateResult };
