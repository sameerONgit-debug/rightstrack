const ANALYSIS_SCHEMA = `Return only valid JSON with this shape:
{
  "domain": "CONSUMER" | "RTI" | "TENANCY" | "LABOR",
  "domainName": string,
  "summary": string,
  "confidence": number,
  "rationale": string,
  "extracted_fields": object,
  "citations": [{"id": string, "title": string, "description": string}],
  "questions": [{"id": string, "text": string, "key": string}],
  "legal_citations": [{"actName": string, "section": string, "excerpt": string, "verifiedDate": string}],
  "clarifying_questions": [{"field_key": string, "question_text": string, "input_type": "text" | "date" | "select"}]
}`;

const DOMAIN_CONFIG = {
  CONSUMER: {
    domainName: 'Consumer Protection Act 2019',
    summary: 'Consumer complaint regarding goods or services',
    citations: [{ id: 'consumer-35', title: 'Consumer Protection Act 2019 - Section 35', description: 'Filing a consumer complaint regarding defective goods or deficient services' }],
    questions: [
      { id: 'q1', text: 'Who is the Seller/Company and what platform was used?', key: 'entity' },
      { id: 'q2', text: 'What is the Order ID, Purchase Date, and Invoice Amount?', key: 'details' },
      { id: 'q3', text: 'What specific resolution are you demanding? (Full refund, replacement, or compensation)', key: 'demand' },
    ],
  },
  RTI: {
    domainName: 'Right to Information Act 2005',
    summary: 'RTI application request',
    citations: [{ id: 'rti-6-1', title: 'RTI Act 2005 - Section 6(1)', description: 'Application for obtaining information' }],
    questions: [
      { id: 'q1', text: 'Which Public Authority / Department are you addressing?', key: 'department' },
      { id: 'q2', text: 'What specific time period or subject does this inquiry cover?', key: 'period' },
      { id: 'q3', text: 'What is the exact information or document required?', key: 'info_required' },
    ],
  },
  TENANCY: {
    domainName: 'Model Tenancy Act & State Rent Control',
    summary: 'Tenancy or rental dispute',
    citations: [{ id: 'tenancy-general', title: 'Applicable State Tenancy Law', description: 'Rights and remedies relating to rent, deposits, and eviction' }],
    questions: [
      { id: 'q1', text: "What is the Landlord's Name and Rented Property Address?", key: 'property' },
      { id: 'q2', text: 'What is the security deposit amount and monthly rent?', key: 'finances' },
      { id: 'q3', text: 'What breach occurred? (Deposit withheld, illegal eviction, no maintenance)', key: 'grievance' },
    ],
  },
  LABOR: {
    domainName: 'Payment of Wages Act & Industrial Disputes Act',
    summary: 'Employment or wage dispute',
    citations: [{ id: 'labor-general', title: 'Applicable Employment Law', description: 'Rights and remedies relating to wages, PF, and termination' }],
    questions: [
      { id: 'q1', text: 'What is the employer name and workplace?', key: 'employer_name' },
      { id: 'q2', text: 'What salary, PF, or employment period is involved?', key: 'employment_period' },
      { id: 'q3', text: 'What action or payment are you requesting?', key: 'relief_requested' },
    ],
  },
};

function classifyLocally(prompt = '') {
  const text = prompt.toLowerCase();
  if (/salary|wages|employer|company|resigned|unpaid|gratuity|job|pf|work/i.test(text)) return 'LABOR';
  if (/refund|seller|product|cooker|amazon|flipkart|warranty|defect/i.test(text)) return 'CONSUMER';
  if (/pm-kisan|subsidy|government|officer|public authority|records/i.test(text)) return 'RTI';
  if (/landlord|tenant|rent|deposit|eviction|flat/i.test(text)) return 'TENANCY';
  return 'RTI';
}

export function fallbackAnalysis(prompt = '') {
  const domain = classifyLocally(prompt);
  const config = DOMAIN_CONFIG[domain];
  const { citations, questions } = config;

  return {
    domain,
    domainName: config.domainName,
    summary: config.summary,
    confidence: 0.78,
    rationale: `Classified locally from the issue description using ${domain.toLowerCase()} dispute indicators.`,
    citations,
    questions,
    text: prompt,
    legal_citations: citations.map((citation) => ({
      id: citation.id,
      actName: citation.title,
      section: citation.title,
      excerpt: citation.description,
      verifiedDate: '2026',
    })),
    clarifying_questions: questions.map((question) => ({
      field_key: question.key,
      question_text: question.text,
      input_type: 'text',
    })),
  };
}

function parseJson(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('AI returned an invalid JSON response.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeCitations(analysis = {}) {
  const citations = analysis.citations || analysis.legal_citations || [];
  return citations.map((citation, index) => ({
    id: citation.id || `citation-${index + 1}`,
    title: citation.title || `${citation.actName || 'Applicable law'} - ${citation.section || 'Relevant provision'}`,
    description: citation.description || citation.excerpt || '',
  }));
}

function answerValue(answers, key, fallback = '[Not provided]') {
  if (Array.isArray(answers)) {
    const answer = answers.find((item) => item.key === key || item.field_key === key);
    return answer?.value || answer?.answer || fallback;
  }
  return answers?.[key] || fallback;
}

export function fallbackDraft({ analysis = {}, answers = {} }) {
  const domain = String(analysis.domain || '').toLowerCase();
  const citations = normalizeCitations(analysis);
  const date = new Date().toLocaleDateString('en-IN');
  let title;
  let draft;

  if (domain.includes('consumer')) {
    title = 'CONSUMER COMPLAINT NOTICE';
    draft = `CONSUMER COMPLAINT NOTICE\n\nDate: ${date}\n\nTo: ${answerValue(answers, 'entity', 'The Seller / Company')}\n\nSubject: Statutory demand regarding defective goods or deficient service\n\nI submit this formal notice regarding the consumer dispute described in my intake.\n\nSeller, company, and platform: ${answerValue(answers, 'entity')}\nOrder ID, purchase date, and invoice amount: ${answerValue(answers, 'details')}\nDemanded resolution: ${answerValue(answers, 'demand')}\n\nThe goods or services supplied were defective or deficient. I demand the stated resolution, together with compensation for any documented loss, within 15 days of receipt of this notice. Please preserve all transaction, delivery, warranty, and complaint records.\n\nFailure to resolve this demand may result in a complaint before the appropriate Consumer Commission under the Consumer Protection Act 2019, seeking refund, replacement, compensation, costs, and other available relief.\n\nSincerely,\n[Consumer name]`;
  } else if (domain.includes('tenan') || domain.includes('rent')) {
    title = 'TENANCY GRIEVANCE NOTICE';
    draft = `TENANCY GRIEVANCE NOTICE\n\nDate: ${date}\n\nTo: ${answerValue(answers, 'property', '[Landlord name and property address]')}\n\nSubject: Statutory demand regarding tenancy grievance\n\nProperty and landlord details: ${answerValue(answers, 'property')}\nSecurity deposit and monthly rent: ${answerValue(answers, 'finances')}\nGrievance or breach: ${answerValue(answers, 'grievance')}\n\nI request that the breach be remedied and that no eviction, lockout, interruption of essential services, or withholding of the security deposit occur except through the applicable lawful process. Please provide a written response within 15 days.\n\nFailure to resolve this demand may result in proceedings before the appropriate rent authority or other competent forum under the Model Tenancy Act & State Rent Control framework, seeking recovery, compensation, and costs.\n\nSincerely,\n[Tenant name]`;
  } else if (domain.includes('labor')) {
    title = 'LABOR AND EMPLOYMENT STATUTORY DEMAND';
    draft = `LABOR AND EMPLOYMENT STATUTORY DEMAND\n\nDate: ${date}\n\nTo: The Employer / Company\n\nSubject: Demand for payment and employment records\n\nEmployer and workplace: ${answerValue(answers, 'employer_name')}\nSalary, PF, or employment period: ${answerValue(answers, 'employment_period')}\nRequested payment or action: ${answerValue(answers, 'relief_requested')}\n\nI demand payment of all lawful wages, benefits, and statutory dues and correction of the employment record within 15 days. Please preserve attendance, payroll, PF, gratuity, and termination records.\n\nFailure to comply may result in a complaint before the appropriate labor authority or tribunal under applicable wage and industrial dispute law, seeking dues, compensation, interest, costs, and other available relief.\n\nSincerely,\n[Employee name]`;
  } else {
    title = 'APPLICATION UNDER THE RIGHT TO INFORMATION ACT, 2005';
    draft = `APPLICATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005\n\nDate: ${date}\n\nTo,\nThe Public Information Officer\n${answerValue(answers, 'department', '[Public Authority / Department]')}\n\nSubject: Request for information under the Right to Information Act, 2005\n\nI, ${answerValue(answers, 'applicant_name', '[Applicant name]')}, am a citizen of India and request the following information under Section 6(1) of the Right to Information Act, 2005.\n\nPublic Authority / Department: ${answerValue(answers, 'department')}\nTime period or subject: ${answerValue(answers, 'period')}\nInformation or documents required: ${answerValue(answers, 'info_required')}\n\nI request that the information be supplied in the prescribed manner within the statutory period. If any part of this request is transferred, please notify me as required by law.\n\nApplication fee details: ${answerValue(answers, 'application_fee_details', '[To be completed]')}\n\nApplicant address and contact details:\n${answerValue(answers, 'applicant_address', '[Address and contact details]')}\n\nSignature: ____________________\nName: ${answerValue(answers, 'applicant_name', '[Applicant name]')}`;
  }

  return {
    title,
    domain: analysis.domain || 'RTI',
    draft,
    citations,
    legal_citations: citations.map((citation) => ({
      id: citation.id,
      actName: citation.title,
      section: citation.title,
      excerpt: citation.description,
      verifiedDate: '2026',
    })),
  };
}

async function callProvider(prompt) {
  console.log('Groq API Key status:', !!process.env.GROQ_API_KEY);
  if (process.env.GROQ_API_KEY) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        messages: [{ role: 'system', content: 'You are a careful legal intake assistant. Never invent statutes. Return the requested JSON only. Classify into exactly one of: CONSUMER, RTI, TENANCY, LABOR. If the issue mentions salary, employer, job, resignation, PF, or wages, the domain MUST be LABOR.' }, { role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) throw new Error(`Groq request failed (${response.status}).`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  if (process.env.GEMINI_API_KEY) {
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!response.ok) throw new Error(`Gemini request failed (${response.status}).`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  throw new Error('No AI provider is configured. Set GROQ_API_KEY or GEMINI_API_KEY.');
}

export async function analyzePrompt(prompt, language = 'en') {
  try {
    const languageInstruction = language === 'hi' ? 'Output rationale, summary, and all user-facing question text in clear conversational Hindi using Devanagari script. Keep domain values, keys, IDs, and JSON structure unchanged.' : 'Output rationale, summary, and user-facing questions in clear English.';
    const result = parseJson(await callProvider(`Classify the following citizen issue accurately before drafting anything. The situation may be written in English, Hindi Devanagari, or mixed Hinglish/Roman Hindi; interpret all of these forms without changing the required JSON structure. Choose exactly one domain based on the primary dispute: CONSUMER for defective products, refunds, e-commerce, warranties, Amazon, Flipkart, or sellers; RTI for government delays, public authority status, scheme records, PM-KISAN, officers, or official file movement; TENANCY for landlord, rent, security deposit, tenant, or illegal eviction disputes; LABOR for unpaid salary, wages, PF, resignation, job, employer, work, or wrongful termination. If the issue mentions salary, employer, job, resignation, PF, or wages, the domain MUST be LABOR. Do not classify a labor issue as TENANCY. ${languageInstruction} ${ANALYSIS_SCHEMA}\n\nSituation:\n${prompt}`));
    const domain = String(result.domain || '').toUpperCase();
    const normalizedDomain = DOMAIN_CONFIG[domain] ? domain : classifyLocally(prompt);
    const legalCitations = (result.legal_citations || []).map((citation, index) => ({ ...citation, id: citation.id || index + 1 }));
    const config = DOMAIN_CONFIG[normalizedDomain];
    const questions = result.questions?.length ? result.questions : config.questions;
    return {
      ...result,
      domain: normalizedDomain,
      domainName: result.domainName || config.domainName,
      summary: result.summary || config.summary,
      text: prompt,
      citations: result.citations || config.citations,
      questions,
      legal_citations: legalCitations.length ? legalCitations : config.citations.map((citation) => ({ id: citation.id, actName: citation.title, section: citation.title, excerpt: citation.description, verifiedDate: '2026' })),
      clarifying_questions: result.clarifying_questions?.length ? result.clarifying_questions : questions.map((question) => ({ field_key: question.key, question_text: question.text, input_type: 'text' })),
    };
  } catch (error) {
    console.error('Analysis provider error:', error);
    return fallbackAnalysis(prompt);
  }
}

export async function draftCase({ analysis, answers, language = 'en' }) {
  const schema = `Return only valid JSON with this shape: { "title": string, "domain": string, "draft": string, "legal_citations": [object] }`;
  try {
    const languageInstruction = language === 'hi' ? 'Draft the official document in formal Hindi legal petition format, or a clear bilingual Hindi-English format. Preserve statutory act names, section numbers, and citations exactly.' : 'Draft the official document in formal English legal notice or petition format.';
    const result = parseJson(await callProvider(`${languageInstruction} The analysis, answers, and original facts may contain English, Hindi Devanagari, or mixed Hinglish/Roman Hindi. Preserve their meaning and do not fail on mixed-language text. Preserve the user's facts, do not invent missing facts, and use only citations supplied in the analysis. ${schema}\n\nAnalysis:\n${JSON.stringify(analysis)}\n\nAnswers:\n${JSON.stringify(answers)}`));
    return { ...result, legal_citations: result.legal_citations || analysis.legal_citations || [] };
  } catch (error) {
    console.error('Case document provider error:', error);
    return fallbackDraft({ analysis, answers });
  }
}
