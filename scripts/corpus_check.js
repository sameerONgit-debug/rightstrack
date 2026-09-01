const assert = require('node:assert/strict');
const { normalizeChunk } = require('../knowledge-base/scripts/build_corpus');

const rti = require('../knowledge-base/rti/rti_act_2005_sections.json');
const consumer = require('../knowledge-base/consumer/consumer_protection_act_2019.json');
const chunks = [
  ...rti.map((chunk, index) => normalizeChunk(chunk, 'RTI', index)),
  ...consumer.map((chunk, index) => normalizeChunk(chunk, 'Consumer', index)),
];

assert.equal(rti.length, 20, 'Expected 20 RTI chunks.');
assert.equal(consumer.length, 20, 'Expected 20 Consumer chunks.');
assert.equal(chunks.length, 40, 'Expected 40 statutory chunks.');
assert.equal(new Set(chunks.map((chunk) => chunk.chunk_id)).size, 40, 'Chunk IDs must be unique.');
assert.ok(chunks.every((chunk) => /^https:\/\/www\.indiacode\.nic\.in\/handle\/123456789\/\d+$/.test(chunk.source_url)), 'Every chunk must link to India Code.');

console.log(`Corpus check: PASS (${rti.length} RTI + ${consumer.length} Consumer = ${chunks.length})`);
