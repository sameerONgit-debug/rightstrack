const fs = require('fs');
const path = require('path');
const { embedBatch } = require('../../lib/rag/embed');
const { supabaseAdmin } = require('../../lib/supabase/server');

const ROOT = path.join(__dirname, '..');
const FILES = [path.join(ROOT, 'rti/rti_act_2005_sections.json'), path.join(ROOT, 'consumer/consumer_protection_act_2019.json')];

function normalizeChunk(raw, domain, index) {
  return {
    chunk_id: raw.chunk_id || raw.citation_key || `${domain.toLowerCase()}-${index + 1}`,
    act_name: raw.act_name || (domain === 'RTI' ? 'Right to Information Act, 2005' : 'Consumer Protection Act, 2019'),
    section_number: raw.section_number || raw.section,
    section_title: raw.section_title || raw.title,
    full_text: raw.full_text || raw.text,
    jurisdiction: raw.jurisdiction || 'Central',
    document_type: raw.document_type || 'statute',
    source_authority: raw.source_authority || 'India Code',
    source_url: raw.source_url || (domain === 'RTI' ? 'https://www.indiacode.nic.in/handle/123456789/17520' : 'https://www.indiacode.nic.in/handle/123456789/17942'),
    effective_date: raw.effective_date || (domain === 'RTI' ? '2005-10-12' : '2020-07-24'),
    last_verified_date: new Date().toISOString().slice(0, 10),
    domain_tag: domain,
  };
}

async function buildCorpus() {
  const chunks = [];
  for (const file of FILES) {
    const domain = file.includes('/rti/') ? 'RTI' : 'Consumer';
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    data.forEach((raw, index) => chunks.push(normalizeChunk(raw, domain, index)));
  }
  if (!process.env.VOYAGE_API_KEY) throw new Error('VOYAGE_API_KEY is required.');
  const embeddings = await embedBatch(chunks.map(c => `${c.act_name}\n${c.section_number}\n${c.section_title}\n${c.full_text}`));
  const rows = chunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i]?.embedding || embeddings[i] }));
  const { error } = await supabaseAdmin.from('statutory_chunks').upsert(rows, { onConflict: 'chunk_id' });
  if (error) throw new Error(`Corpus upsert failed: ${error.message}`);
  console.log(`Upserted ${rows.length} legal chunks.`);
}

if (require.main === module) buildCorpus().catch(error => { console.error(error); process.exit(1); });
module.exports = { buildCorpus, normalizeChunk };
