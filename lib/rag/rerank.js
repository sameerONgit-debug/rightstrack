function rerank(chunks, domain, limit = 4) {
  const expected = domain === 'RTI' ? 'RTI' : domain === 'Consumer' ? 'Consumer' : null;
  return [...(chunks || [])]
    .map(chunk => ({ ...chunk, rerank_score: Number(chunk.similarity || chunk.score || 0) + (expected && chunk.domain_tag === expected ? 0.08 : 0) + (chunk.document_type === 'statute' ? 0.04 : 0) }))
    .sort((a, b) => b.rerank_score - a.rerank_score)
    .slice(0, limit);
}
module.exports = { rerank };
