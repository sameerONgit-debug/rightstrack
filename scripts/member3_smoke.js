const assert = require('assert');
const { classify } = require('../lib/ai/classify');
const { analyze } = require('../lib/ai/analyze');
const { validateCitations } = require('../lib/rag/validate');

(async () => {
  const rti = await classify("My PM-KISAN farmer subsidy hasn't come in 3 months and the block office won't tell me what's wrong");
  assert.strictEqual(rti.domain, 'RTI');

  const consumer = await classify('I bought a pressure cooker online for ₹2,400, it arrived with a cracked lid, and the seller is refusing to refund me');
  assert.strictEqual(consumer.domain, 'Consumer');

  const unsupported = await classify('My landlord is trying to evict me without giving proper notice');
  assert.strictEqual(unsupported.domain, 'Unsupported');

  const analysis = await analyze('My PM-KISAN farmer subsidy has not arrived and the block office will not explain why');
  assert.strictEqual(analysis.domain, 'RTI');
  assert.ok(Array.isArray(analysis.clarifying_questions));

  const retrieved = [{ chunk_id: 'rti-s6-1', act_name: 'Right to Information Act, 2005', section_number: '6(1)' }];
  const valid = validateCitations([{ chunk_id: 'rti-s6-1', act_name: 'Right to Information Act, 2005', section_number: '6(1)' }], retrieved);
  assert.strictEqual(valid[0].grounded, true);

  const hallucinated = validateCitations([{ chunk_id: 'fake', act_name: 'Right to Information Act, 2005', section_number: '99' }], retrieved);
  assert.strictEqual(hallucinated[0].grounded, false);

  console.log('Member 3 smoke tests: PASS');
})();
