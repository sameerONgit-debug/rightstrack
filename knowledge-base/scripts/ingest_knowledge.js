/**
 * Knowledge Base Ingestion Script
 * Loads statutory sections into Supabase pgvector with Voyage AI legal embeddings.
 */

const fs = require('fs');
const path = require('path');

async function ingestKnowledge() {
  console.log('=== RightsTrack Knowledge Base Ingestion ===');

  const rtiPath = path.join(__dirname, '../rti/rti_act_2005_sections.json');
  const consumerPath = path.join(__dirname, '../consumer/consumer_protection_act_2019.json');

  const rtiSections = JSON.parse(fs.readFileSync(rtiPath, 'utf8'));
  const consumerSections = JSON.parse(fs.readFileSync(consumerPath, 'utf8'));

  console.log(`Loaded ${rtiSections.length} RTI Act 2005 sections.`);
  console.log(`Loaded ${consumerSections.length} Consumer Protection Act 2019 sections.`);
  console.log('Ready to generate Voyage AI embeddings and insert into Supabase pgvector table: statutory_chunks');
}

if (require.main === module) {
  ingestKnowledge().catch((err) => {
    console.error('Ingestion failed:', err);
    process.exit(1);
  });
}

module.exports = { ingestKnowledge };
