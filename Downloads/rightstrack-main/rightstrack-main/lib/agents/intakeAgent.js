import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Domain classification and statutory requirements mapping
const DOMAIN_CONFIG = {
  RTI: {
    name: 'Right to Information Act 2005',
    keywords: ['information', 'public authority', 'records', 'disclosure', 'government', 'official', 'petition', 'rtc'],
    requiredFields: ['publicAuthority', 'informationRequired', 'timeframe', 'urgency'],
    statutoryClauses: ['6(1)', '6(3)', '7(1)', '8(1)'],
    escalationDeadline: 45, // days for First Appeal
  },
  CONSUMER: {
    name: 'Consumer Protection Act 2019',
    keywords: ['product', 'service', 'defect', 'refund', 'seller', 'purchase', 'complaint', 'warranty', 'quality'],
    requiredFields: ['sellerName', 'productDescription', 'purchaseDate', 'amount', 'defectDescription', 'demandedRelief'],
    statutoryClauses: ['2(7)', '2(9)', '35', '36(1)', '100'],
    escalationDeadline: 30, // days for First Appeal
  },
  CYBER_FRAUD: {
    name: 'Information Technology Act 2000 & IPC Cyber Crime Sections',
    keywords: ['fraud', 'cyber', 'online', 'hacking', 'phishing', 'scam', 'data theft', 'identity', 'otp', 'password'],
    requiredFields: ['incidentDate', 'fraudDescription', 'amountLost', 'evidenceDetails', 'accountsAffected'],
    statutoryClauses: ['66', '66B', '66C', '66D', '420-IPC', '468-IPC'],
    escalationDeadline: 60, // days for escalation to CBI/specialized cyber cell
  },
  MUNICIPAL: {
    name: 'Municipal Corporation Act & Local Governance Rules',
    keywords: ['municipal', 'civic', 'pothole', 'water', 'garbage', 'streetlight', 'civic', 'cmmc', 'ward', 'grievance'],
    requiredFields: ['grievanceType', 'location', 'description', 'photosAttached', 'daysUnresolved'],
    statutoryClauses: ['general-principles', 'schedule-4', 'municipal-rules'],
    escalationDeadline: 45, // days for escalation through municipal hierarchy
  },
};

/**
 * Analyzes unstructured grievance text and classifies into domains
 * Identifies missing statutory requirements and generates clarifying questions
 */
async function analyzeGrievance(grievanceText, language = 'en') {
  try {
    //const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const analysisPrompt = `
You are a legal intake specialist for a Civic AI Legal Agent. Analyze the following grievance and:

1. Classify into one of these domains: RTI, CONSUMER, CYBER_FRAUD, or MUNICIPAL
2. Assign a confidence score (0-1) for the classification
3. Extract all structured fields relevant to the domain
4. Identify which statutory requirements are missing
5. Generate exactly 3 precise, dynamic clarifying questions to fill gaps
6. Provide domain-specific legal citations

Grievance Text:
"${grievanceText}"

Respond in valid JSON only with this structure:
{
  "domain": "RTI" | "CONSUMER" | "CYBER_FRAUD" | "MUNICIPAL",
  "domainName": string,
  "confidence": number,
  "summary": string,
  "extractedFields": object,
  "missingFields": [string],
  "clarifyingQuestions": [
    {
      "id": string (uuid-like),
      "fieldKey": string,
      "questionText": string,
      "inputType": "text" | "date" | "textarea" | "select" | "file",
      "priority": "high" | "medium" | "low",
      "reason": string
    }
  ],
  "initialCitations": [
    {
      "actName": string,
      "section": string,
      "excerpt": string,
      "relevance": string
    }
  ],
  "nextSteps": [string],
  "estimatedComplexity": "simple" | "moderate" | "complex"
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

const firstBrace = cleanText.indexOf('{');
const lastBrace = cleanText.lastIndexOf('}');

if (firstBrace === -1 || lastBrace === -1) {
  throw new Error('Failed to parse AI response as JSON');
}

const analysis = JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      language,
      analysis,
      rawInput: grievanceText,
      status: 'analyzed',
    };
  } catch (error) {
    console.error('Intake Agent Error:', error);
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      language,
      error: error.message,
      fallbackDomain: classifyLocally(grievanceText),
      status: 'error',
    };
  }
}

/**
 * Fallback local classification when AI fails
 */
function classifyLocally(text) {
  const lowerText = text.toLowerCase();
  
  for (const [domain, config] of Object.entries(DOMAIN_CONFIG)) {
    if (config.keywords.some(keyword => lowerText.includes(keyword))) {
      return domain;
    }
  }
  
  return 'MUNICIPAL'; // Default fallback
}

/**
 * Validates completeness of grievance data for a domain
 */
function validateCompleteness(analysis, domain) {
  const config = DOMAIN_CONFIG[domain];
  if (!config) return { complete: false, coverage: 0, missing: [] };

  const extracted = Object.keys(analysis.extractedFields || {});
  const required = config.requiredFields;
  const missing = required.filter(field => !extracted.includes(field));
  
  const coverage = (required.length - missing.length) / required.length;

  return {
    complete: missing.length === 0,
    coverage: Math.round(coverage * 100),
    missing,
    requiredFields: required,
  };
}

/**
 * Generates system prompt for multi-language support
 */
function getLanguageInstruction(language) {
  const instructions = {
    en: 'Write clearly in English.',
    hi: 'Write in Hindi (Devanagari script), keeping legal terms and IDs in English.',
    mr: 'Write in Marathi (Devanagari script), keeping legal terms and IDs in English.',
    bn: 'Write in Bengali script, keeping legal terms and IDs in English.',
    ta: 'Write in Tamil script, keeping legal terms and IDs in English.',
  };
  return instructions[language] || instructions.en;
}

export const intakeAgent = {
  analyzeGrievance,
  classifyLocally,
  validateCompleteness,
  DOMAIN_CONFIG,
  getLanguageInstruction,
};
