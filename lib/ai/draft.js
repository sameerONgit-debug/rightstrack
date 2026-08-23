const { validateResult } = require('../rag/validate');

function buildDraft({ domain, fields = {}, retrievedChunks = [] }) {
  if (!retrievedChunks.length) return { explanation_text: 'We could not find a sufficiently relevant provision in the supported legal corpus. No grounded document was generated.', document_text: '', citations: [], insufficient_information: true };
  const citations = retrievedChunks.map(c => ({ chunk_id: c.chunk_id, act_name: c.act_name, section_number: c.section_number || c.section, section_title: c.section_title || c.title }));
  let document_text;
  let explanation_text;
  if (domain === 'RTI') {
    document_text = `To,\nThe Public Information Officer\n${fields.authority_name || '[Public Authority]'}\n\nSubject: Request for information under the Right to Information Act, 2005\n\nSir/Madam,\nI request the following information: ${fields.information_requested || '[Information requested]'}. Please provide the information in accordance with the applicable provisions of the Right to Information Act, 2005.\n\nApplicant: ${fields.applicant_name || '[Applicant name]'}\nAddress: ${fields.applicant_address || '[Applicant address]'}\n\nSignature: __________________`;
    explanation_text = 'This draft uses the retrieved RTI provisions and only the facts supplied by the user. Verify the authority and application details before filing.';
  } else if (domain === 'Consumer') {
    document_text = `To,\nThe District Consumer Disputes Redressal Commission\n\nSubject: Consumer complaint regarding ${fields.product_or_service || '[product/service]'}\n\nThe complainant states that ${fields.issue || '[describe the defect or deficiency]'}. The transaction amount was ${fields.claim_amount ? `₹${fields.claim_amount}` : '[amount]'}. The relief sought is ${fields.relief_sought || '[refund/replacement/other remedy]'}.\n\nComplainant: ${fields.applicant_name || '[Applicant name]'}\nState: ${fields.state || '[State]'}\n\nSignature: __________________`;
    explanation_text = 'This draft is based on retrieved Consumer Protection Act provisions. Confirm the forum, claim details and state-specific procedural requirements before filing.';
  } else return { explanation_text: 'This legal domain is outside the supported MVP corpus.', document_text: '', citations: [], insufficient_information: true };
  return validateResult({ explanation_text, document_text, citations }, retrievedChunks);
}
module.exports = { buildDraft };
