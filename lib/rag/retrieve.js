const { supabaseAdmin } = require('../supabase/server');
const { embedText } = require('./embed');

async function retrieve(query, domain, limit = 5, threshold = 0.55) {
  const embedding = await embedText(query);
  if (!embedding.length) return [];
  const { data, error } = await supabaseAdmin.rpc('match_statutory_chunks', {
    query_embedding: embedding,
    match_domain: domain,
    match_threshold: threshold,
    match_count: limit,
  });
  if (error) throw new Error(`Vector retrieval failed: ${error.message}`);
  return (data || []).map(row => ({ ...row, similarity: Number(row.similarity ?? row.score ?? 0) }));
}
module.exports = { retrieve };
