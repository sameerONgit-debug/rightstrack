const { validateResult } = require('../rag/validate');

function buildEscalation({ caseContext = {}, retrievedChunks = [] }) {
  if (!retrievedChunks.length) return { document: { type: 'appeal', content: '', citations: [] }, insufficient_information: true };
  const appealProvision = retrievedChunks.find(c => String(c.section_number || c.section).includes('19(1)'));
  if (!appealProvision) return { document: { type: 'appeal', content: '', citations: [] }, insufficient_information: true };
  const citation = { chunk_id: appealProvision.chunk_id, act_name: appealProvision.act_name, section_number: appealProvision.section_number || appealProvision.section, section_title: appealProvision.section_title || appealProvision.title };
  const result = validateResult({
    document: { type: 'appeal', content: `To,\nThe First Appellate Authority\n\nSubject: First appeal regarding RTI application ${caseContext.case_id || '[case ID]'}\n\nI filed an RTI application on ${caseContext.filed_date || '[filing date]'} and have not received the required decision/information. I therefore prefer this first appeal under the retrieved statutory appeal provision.\n\nApplicant: ${caseContext.applicant_name || '[Applicant name]'}\n\nSignature: __________________`, citations: [citation] },
    citations: [citation],
  }, retrievedChunks);
  return result;
}
module.exports = { buildEscalation };
