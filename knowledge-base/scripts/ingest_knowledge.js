/**
 * Knowledge Base Ingestion Script
 * Loads statutory sections into Supabase pgvector with Voyage AI legal embeddings.
 */

const { buildCorpus } = require('./build_corpus');

async function ingestKnowledge() {
  console.log('=== RightsTrack Knowledge Base Ingestion ===');

  await buildCorpus();
}

if (require.main === module) {
  ingestKnowledge().catch((err) => {
    console.error('Ingestion failed:', err);
    process.exit(1);
  });
}

module.exports = { ingestKnowledge };
