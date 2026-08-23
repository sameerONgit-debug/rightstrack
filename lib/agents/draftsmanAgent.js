import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Document template configurations for each domain
 */
const DOCUMENT_TEMPLATES = {
  RTI: {
    type: 'rti_application',
    title: 'Right to Information Act Application',
    structure: [
      'petitioner_details',
      'public_authority_details',
      'information_sought',
      'statutory_references',
      'timeline_request',
      'fee_information',
      'declaration',
    ],
    format: 'formal_letter',
  },
  CONSUMER: {
    type: 'consumer_notice',
    title: 'Notice Under Consumer Protection Act 2019',
    structure: [
      'consumer_details',
      'opposite_party_details',
      'product_service_details',
      'defect_description',
      'damages_claimed',
      'relief_demanded',
      'statutory_references',
      'legal_notice_warning',
      'declaration',
    ],
    format: 'legal_notice',
  },
  CYBER_FRAUD: {
    type: 'cyber_crime_complaint',
    title: 'Cyber Crime Complaint Memo',
    structure: [
      'complainant_details',
      'incident_description',
      'fraud_mechanism',
      'evidence_details',
      'losses_incurred',
      'bank_details_compromised',
      'statutory_violations',
      'relief_sought',
      'evidence_checklist',
    ],
    format: 'complaint_memo',
  },
  MUNICIPAL: {
    type: 'civic_grievance_petition',
    title: 'Civic Grievance Escalation Petition',
    structure: [
      'citizen_details',
      'grievance_type',
      'location_details',
      'problem_description',
      'timeline',
      'previous_complaints',
      'evidence_attached',
      'relief_demanded',
      'statutory_basis',
    ],
    format: 'grievance_petition',
  },
};

/**
 * Generates a formal petition or document based on domain and case data
 */
async function generateDocument(domain, caseData, language = 'en', documentType = null) {
  try {
    const template = DOCUMENT_TEMPLATES[domain];
    if (!template) {
      throw new Error(`Unknown domain: ${domain}`);
    }

    const docType = documentType || template.type;
    //const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const drafting_prompt = `
You are an expert legal drafter specializing in statutory documents for ${domain} cases.

Generate a formal, legally sound ${template.title} with these case details:

Case Data:
${JSON.stringify(caseData, null, 2)}

Language: ${getLanguageLabel(language)}

Requirements:
1. Use formal legal language appropriate for statutory proceedings
2. Include all relevant statutory references and section citations
3. Structure must include: ${template.structure.join(', ')}
4. Include specific dates, amounts, and factual details from case data
5. Maintain professional tone suitable for ${template.format}
6. Include clear, actionable relief demanded
7. Add declaration statement at the end
8. Use proper legal formatting with line numbers if applicable
9. Write the user-facing content in ${getLanguageLabel(language)}, but keep legal terms, section numbers, and JSON properties in English

Respond with valid JSON:
{
  "documentId": string (uuid),
  "domain": string,
  "documentType": string,
  "documentTitle": string,
  "language": string,
  "draftedAt": string (ISO),
  "content": string (full document text with \\n for line breaks),
  "sections": [
    {
      "sectionName": string,
      "content": string,
      "citations": [string]
    }
  ],
  "includesStatutoryCitations": boolean,
  "citationCount": number,
  "estimatedFilingDate": string,
  "nextSteps": [string],
  "warningsAndCautions": [string]
}`;

   const completion = await groq.chat.completions.create({
  model: 'openai/gpt-oss-120b',
  messages: [{ role: 'user', content: drafting_prompt }],
});

const text = completion.choices[0].message.content;
let cleanText = text.trim();
if (cleanText.includes('```json')) {
  cleanText = cleanText.split('```json')[1].split('```')[0].trim();
} else if (cleanText.includes('```')) {
  cleanText = cleanText.split('```')[1].split('```')[0].trim();
}

// ✅ Resilient Parsing Logic:
let document;
const firstBrace = cleanText.indexOf('{');
const lastBrace = cleanText.lastIndexOf('}');

if (firstBrace !== -1 && lastBrace !== -1) {
  try {
    document = JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
  } catch (e) {
    document = {
      title: 'Legal Grievance Document',
      content: text,
      body: text,
      sections: [{ heading: 'Statement of Grievance', body: text }]
    };
  }
} else {
  document = {
    title: 'Legal Grievance Document',
    content: text,
    body: text,
    sections: [{ heading: 'Statement of Grievance', body: text }]
  };
}
    document.draftedAt = new Date().toISOString();
    document.status = 'draft';
    document.version = 1;

    return document;
  } catch (error) {
    console.error('Document Generation Error:', error);
    return {
      documentId: uuidv4(),
      domain,
      error: error.message,
      status: 'error',
    };
  }
}

/**
 * Generates RTI Application specifically
 */
async function generateRTIApplication(publicAuthority, informationSought, timeframe, language = 'en') {
  const caseData = {
    petitioner: {
      name: '[[PETITIONER_NAME]]',
      address: '[[PETITIONER_ADDRESS]]',
      email: '[[PETITIONER_EMAIL]]',
      phone: '[[PETITIONER_PHONE]]',
    },
    publicAuthority: {
      name: publicAuthority,
      address: '[[AUTHORITY_ADDRESS]]',
      referenceNumber: '[[RTI_REFERENCE]]',
    },
    informationSought,
    timeframeRequired: timeframe,
    feePaymentMethod: 'demand_draft_or_fee_deposit',
  };

  return generateDocument('RTI', caseData, language, 'rti_application');
}

/**
 * Generates Consumer Protection Notice
 */
async function generateConsumerNotice(sellerName, productDetails, defectDescription, amountClaimed, language = 'en') {
  const caseData = {
    consumer: {
      name: '[[CONSUMER_NAME]]',
      address: '[[CONSUMER_ADDRESS]]',
      email: '[[CONSUMER_EMAIL]]',
      phone: '[[CONSUMER_PHONE]]',
    },
    oppositeParty: {
      name: sellerName,
      address: '[[SELLER_ADDRESS]]',
      type: 'seller_or_service_provider',
    },
    product: productDetails,
    defect: defectDescription,
    amountClaimed,
    demandedRelief: 'refund_or_replacement_or_compensation',
    purchaseDate: '[[PURCHASE_DATE]]',
    invoiceAmount: amountClaimed,
  };

  return generateDocument('CONSUMER', caseData, language, 'consumer_notice');
}

/**
 * Generates Cyber Crime Complaint Memo
 */
async function generateCyberCrimeComplaint(incidentDescription, fraudMechanism, amountLost, evidenceDetails, language = 'en') {
  const caseData = {
    complainant: {
      name: '[[COMPLAINANT_NAME]]',
      address: '[[COMPLAINANT_ADDRESS]]',
      email: '[[COMPLAINANT_EMAIL]]',
      phone: '[[COMPLAINANT_PHONE]]',
      accountsAffected: '[[ACCOUNTS_LIST]]',
    },
    incident: {
      date: '[[INCIDENT_DATE]]',
      description: incidentDescription,
      fraudMechanism,
      amountLost,
    },
    evidence: evidenceDetails,
    bankAccountsCompromised: '[[BANK_ACCOUNT_DETAILS]]',
    otp_otpStolenDetails: '[[OTP_INCIDENT_DETAILS]]',
    policeFIRStatus: '[[FIR_DETAILS_IF_ANY]]',
  };

  return generateDocument('CYBER_FRAUD', caseData, language, 'cyber_crime_complaint');
}

/**
 * Generates Municipal/Civic Grievance Petition
 */
async function generateCivicGrievancePetition(grievanceType, location, description, daysUnresolved, language = 'en') {
  const caseData = {
    citizen: {
      name: '[[CITIZEN_NAME]]',
      address: location,
      email: '[[CITIZEN_EMAIL]]',
      phone: '[[CITIZEN_PHONE]]',
      wardNumber: '[[WARD_NUMBER]]',
    },
    grievance: {
      type: grievanceType,
      location,
      description,
      reportedDate: '[[FIRST_REPORTED_DATE]]',
      daysUnresolved,
    },
    previousComplaints: '[[PREVIOUS_COMPLAINT_NUMBERS]]',
    evidenceAttached: ['photographs', 'date_stamped_videos'],
    reliefDemanded: 'immediate_resolution_and_inspection',
  };

  return generateDocument('MUNICIPAL', caseData, language, 'civic_grievance_petition');
}

/**
 * Adds statutory citations to an existing document
 */
async function addCitationsToDocument(documentId, documentContent, domain, citationList) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const citation_prompt = `
You are a legal citation expert. Add inline citations to this document and provide a formal citations section.

Domain: ${domain}
Provided Citations to integrate: ${JSON.stringify(citationList, null, 2)}

Original Document:
${documentContent}

Add citations in the format [Act Name, Section X] inline where relevant, and create a comprehensive citations section at the end.

Respond with JSON:
{
  "documentId": string,
  "citationsAdded": number,
  "contentWithCitations": string,
  "citationsSection": string,
  "citationQuality": "comprehensive" | "adequate" | "minimal"
}`;

    const response = await model.generateContent(citation_prompt);
    const text = response.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { documentId, contentWithCitations: documentContent, error: 'Failed to process citations' };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Citation Addition Error:', error);
    return { documentId, error: error.message };
  }
}

/**
 * Validates document for legal sufficiency and completeness
 */
function validateDocumentCompleteness(document, domain) {
  const template = DOCUMENT_TEMPLATES[domain];
  if (!template) return { valid: false, errors: ['Unknown domain'] };

  const errors = [];
  const warnings = [];

  // Check for placeholder replacement
  const placeholderMatches = (document.content || '').match(/\[\[.*?\]\]/g) || [];
  if (placeholderMatches.length > 0) {
    warnings.push(`${placeholderMatches.length} placeholder(s) still need to be filled: ${placeholderMatches.slice(0, 3).join(', ')}`);
  }

  // Check structure
  const requiredSections = template.structure;
  const documentSections = document.sections?.map(s => s.sectionName) || [];
  const missingSections = requiredSections.filter(section => !documentSections.includes(section));
  
  if (missingSections.length > 0) {
    warnings.push(`Missing sections: ${missingSections.join(', ')}`);
  }

  // Check content length
  const contentLength = (document.content || '').length;
  if (contentLength < 500) {
    errors.push('Document content is too brief (minimum 500 characters required)');
  }

  // Check for citations
  if (!document.includesStatutoryCitations) {
    warnings.push('No statutory citations found in document');
  }

  return {
    valid: errors.length === 0,
    documentId: document.documentId,
    errors,
    warnings,
    readinessScore: Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5)),
  };
}

/**
 * Helper function to get language label
 */
function getLanguageLabel(code) {
  const labels = {
    en: 'English',
    hi: 'Hindi (Devanagari)',
    mr: 'Marathi (Devanagari)',
    bn: 'Bengali',
    ta: 'Tamil',
  };
  return labels[code] || 'English';
}

export const draftsmanAgent = {
  generateDocument,
  generateRTIApplication,
  generateConsumerNotice,
  generateCyberCrimeComplaint,
  generateCivicGrievancePetition,
  addCitationsToDocument,
  validateDocumentCompleteness,
  DOCUMENT_TEMPLATES,
};
