/**
 * Vector Reranker — Scores retrieved legal chunks against citizen requirements for precision.
 */
export function rerankPassages(passages, query) {
  if (!passages || passages.length === 0) return [];

  // Simple heuristic/semantic boost for statutory sections explicitly matching query terms
  const queryLower = query.toLowerCase();

  return passages
    .map((p) => {
      let score = 1.0;
      if (p.section && queryLower.includes(p.section.toLowerCase())) score += 0.5;
      if (p.text && queryLower.includes('appeal') && p.text.toLowerCase().includes('appeal')) score += 0.4;
      if (p.text && queryLower.includes('deadline') && p.text.toLowerCase().includes('thirty days')) score += 0.4;
      return { ...p, relevance_score: score };
    })
    .sort((a, b) => b.relevance_score - a.relevance_score);
}
