import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
/**
 * Statutory deadline configurations for each domain
 * Defines escalation windows and appeal deadlines
 */
const ESCALATION_CONFIG = {
  RTI: {
    domain: 'RTI',
    firstAppealDeadline: 45, // days from RTI filing
    secondAppealDeadline: 90, // days from RTI filing
    escalationTriggers: {
      noResponseDeadline: 30,
      partialResponseTrigger: true,
      denialTrigger: true,
    },
    appeals: [
      {
        level: 1,
        title: 'First Appeal to State Information Commission',
        deadline: 45,
        authority: 'State Information Commissioner',
      },
      {
        level: 2,
        title: 'Second Appeal to Central Information Commission',
        deadline: 90,
        authority: 'Chief Information Commissioner (CIC)',
      },
    ],
  },
  CONSUMER: {
    domain: 'CONSUMER',
    complaintValidityPeriod: 2, // years from purchase
    firstAppealDeadline: 30, // days from order
    secondAppealDeadline: 60,
    escalationTriggers: {
      noResponseDeadline: 30,
      unfavorableOrderTrigger: true,
      orderWithoutReasonsTrigger: true,
    },
    appeals: [
      {
        level: 1,
        title: 'First Appeal to State Consumer Commission',
        deadline: 30,
        authority: 'State Consumer Commission',
      },
      {
        level: 2,
        title: 'Second Appeal to National Consumer Commission',
        deadline: 60,
        authority: 'National Consumer Commission',
      },
    ],
  },
  CYBER_FRAUD: {
    domain: 'CYBER_FRAUD',
    criminalComplaintDeadline: 60, // days from discovery
    bankFraudReportDeadline: 24, // hours from discovery
    escalationTriggers: {
      amountThreshold: 5000, // INR - triggers CBI involvement
      multipleAccountsCompromised: true,
      internationalScamIndicators: true,
    },
    appeals: [
      {
        level: 1,
        title: 'Escalation to State Police Cyber Cell',
        deadline: 15,
        authority: 'State Cyber Crime Unit',
      },
      {
        level: 2,
        title: 'Escalation to Central Bureau of Investigation (CBI)',
        deadline: 30,
        authority: 'CBI Cyber Crime Division',
      },
    ],
  },
  MUNICIPAL: {
    domain: 'MUNICIPAL',
    firstResponseDeadline: 15, // days from complaint
    resolutionDeadline: 45, // days from complaint
    escalationTriggers: {
      noResponseDeadline: 15,
      inadequateResponseTrigger: true,
      healthSafetyRisk: true,
    },
    appeals: [
      {
        level: 1,
        title: 'Escalation to Ward Officer/Zonal Commissioner',
        deadline: 30,
        authority: 'Zonal Commissioner',
      },
      {
        level: 2,
        title: 'Escalation to Municipal Commissioner',
        deadline: 45,
        authority: 'Municipal Commissioner',
      },
    ],
  },
};

/**
 * Calculates statutory deadlines and creates watchdog alerts
 */
function calculateStatutoryDeadlines(domain, filingDate) {
  const config = ESCALATION_CONFIG[domain];
  if (!config) {
    return { error: `Unknown domain: ${domain}` };
  }

  const filing = new Date(filingDate);
  const today = new Date();
  const deadlines = [];

  // Calculate all appeal deadlines
  for (const appeal of config.appeals) {
    const appealDeadline = new Date(filing);
    appealDeadline.setDate(appealDeadline.getDate() + appeal.deadline);

    const daysRemaining = Math.ceil((appealDeadline - today) / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining < 0;
    const isUrgent = daysRemaining > 0 && daysRemaining <= 7;

    deadlines.push({
      appealLevel: appeal.level,
      appealTitle: appeal.title,
      authority: appeal.authority,
      deadline: appealDeadline.toISOString(),
      daysFromFiling: appeal.deadline,
      daysRemaining,
      isOverdue,
      isUrgent,
      status: isOverdue ? 'OVERDUE' : isUrgent ? 'URGENT' : 'ACTIVE',
    });
  }

  return {
    domain,
    filingDate: filing.toISOString(),
    today: today.toISOString(),
    deadlines: deadlines.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)),
  };
}

/**
 * Checks if case is eligible for escalation based on domain rules
 */
function checkEscalationEligibility(domain, caseStatus, statusLastUpdated) {
  const config = ESCALATION_CONFIG[domain];
  if (!config) {
    return { eligible: false, reason: 'Unknown domain' };
  }

  const lastUpdate = new Date(statusLastUpdated);
  const today = new Date();
  const daysSinceUpdate = Math.ceil((today - lastUpdate) / (1000 * 60 * 60 * 24));

  const triggers = config.escalationTriggers;
  const eligibilityReasons = [];

  // Check no-response trigger
  if (daysSinceUpdate >= triggers.noResponseDeadline) {
    eligibilityReasons.push(`No response for ${daysSinceUpdate} days (threshold: ${triggers.noResponseDeadline} days)`);
  }

  // Domain-specific checks
  if (domain === 'RTI' && triggers.partialResponseTrigger && caseStatus === 'partial_response') {
    eligibilityReasons.push('Partial response received - eligible for First Appeal');
  }

  if (domain === 'CONSUMER' && triggers.unfavorableOrderTrigger && caseStatus === 'order_unfavorable') {
    eligibilityReasons.push('Unfavorable order received - eligible for appeal');
  }

  if (domain === 'CYBER_FRAUD' && triggers.internationalScamIndicators && caseStatus === 'international_scam_suspected') {
    eligibilityReasons.push('International indicators detected - CBI escalation recommended');
  }

  if (domain === 'MUNICIPAL' && triggers.healthSafetyRisk && caseStatus === 'health_safety_risk') {
    eligibilityReasons.push('Public health/safety risk identified - escalation required');
  }

  return {
    domain,
    eligible: eligibilityReasons.length > 0,
    reasons: eligibilityReasons,
    daysSinceLastUpdate,
    recommendedAppealLevel: eligibilityReasons.length > 0 ? 1 : null,
  };
}

/**
 * Generates First Appeal petition with full statutory citations
 */
async function generateFirstAppealPetition(caseId, domain, originalFilingDetails, appealReason, language = 'en') {
  try {
    //const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const appeal_prompt = `
You are an expert legal drafter specializing in statutory appeals for ${domain} cases.

Generate a formal First Appeal petition with these details:

Original Case ID: ${caseId}
Domain: ${domain}
Original Filing Details: ${JSON.stringify(originalFilingDetails, null, 2)}
Appeal Reason: ${appealReason}
Language: ${getLanguageLabel(language)}

Generate a comprehensive First Appeal petition that:
1. References the original filing and case details
2. Clearly articulates grounds for appeal
3. Includes relevant statutory provisions for this domain
4. Specifies the authority to which appeal is made (${ESCALATION_CONFIG[domain]?.appeals[0]?.authority || 'Appropriate Authority'})
5. Demands specific relief
6. Includes timeline urgency if applicable
7. Contains formal declarations

The document should be ready for filing.

Respond with valid JSON:
{
  "appealId": string,
  "appealLevel": 1,
  "caseId": string,
  "domain": string,
  "originalCaseReference": string,
  "appealReason": string,
  "authority": string,
  "appealTitle": string,
  "content": string (full petition text),
  "grounds": [string],
  "reliefSought": [string],
  "statutoryCitations": [string],
  "dueDate": string,
  "filingInstructions": [string],
  "requiredAttachments": [string],
  "readinessPercentage": number
}`;

    const completion = await groq.chat.completions.create({
  model: 'openai/gpt-oss-120b',
  messages: [{ role: 'user', content: appeal_prompt }],
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
  throw new Error('Failed to parse appeal petition response');
}

const appealDocument = JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
    appeal.appealId = uuidv4();
    appeal.generatedAt = new Date().toISOString();
    appeal.status = 'draft';

    // Save to database
    await supabase.from('appeal_petitions').insert([{
      id: appeal.appealId,
      case_id: caseId,
      domain,
      appeal_level: appeal.appealLevel,
      authority: appeal.authority,
      content: appeal.content,
      grounds: appeal.grounds,
      relief_sought: appeal.reliefSought,
      status: 'draft',
      created_at: new Date().toISOString(),
    }]);

    return appeal;
  } catch (error) {
    console.error('Appeal Generation Error:', error);
    return {
      appealId: uuidv4(),
      caseId,
      domain,
      error: error.message,
      status: 'error',
    };
  }
}

/**
 * Monitors case and generates escalation alerts
 */
async function monitorCaseAndAlert(caseId, domain, caseData) {
  try {
    const deadlines = calculateStatutoryDeadlines(domain, caseData.filingDate);
    const eligibility = checkEscalationEligibility(domain, caseData.status, caseData.lastUpdate);

    const alerts = [];

    // Check for urgent deadlines
    for (const deadline of deadlines.deadlines) {
      if (deadline.isUrgent) {
        alerts.push({
          type: 'DEADLINE_URGENT',
          severity: 'high',
          message: `${deadline.daysRemaining} days remaining for ${deadline.appealTitle}`,
          deadline: deadline.deadline,
          actionRequired: 'file_appeal',
        });
      }

      if (deadline.isOverdue) {
        alerts.push({
          type: 'DEADLINE_OVERDUE',
          severity: 'critical',
          message: `Overdue for ${deadline.appealTitle} by ${Math.abs(deadline.daysRemaining)} days`,
          deadline: deadline.deadline,
          actionRequired: 'file_appeal_immediately',
        });
      }
    }

    // Check escalation eligibility
    if (eligibility.eligible) {
      alerts.push({
        type: 'ESCALATION_ELIGIBLE',
        severity: 'high',
        message: `Case eligible for escalation: ${eligibility.reasons.join('; ')}`,
        appealLevel: eligibility.recommendedAppealLevel,
        actionRequired: 'generate_appeal_petition',
      });
    }

    // Save monitoring record
    await supabase.from('case_monitoring').insert([{
      case_id: caseId,
      domain,
      check_date: new Date().toISOString(),
      alerts_generated: alerts.length,
      deadlines_status: JSON.stringify(deadlines),
      escalation_eligible: eligibility.eligible,
    }]);

    return {
      caseId,
      domain,
      monitoringDate: new Date().toISOString(),
      deadlines,
      escalationStatus: eligibility,
      alerts,
      totalAlerts: alerts.length,
      requiresImmediateAction: alerts.some(a => a.severity === 'critical'),
    };
  } catch (error) {
    console.error('Case Monitoring Error:', error);
    return {
      caseId,
      error: error.message,
      status: 'error',
    };
  }
}

/**
 * Generates scheduled watchdog report for multiple cases
 */
async function generateWatchdogReport(caseIds, domain = null) {
  try {
    const reports = [];

    for (const caseId of caseIds) {
      const { data: caseData } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (!caseData) continue;

      const monitoring = await monitorCaseAndAlert(caseId, caseData.domain, caseData);
      reports.push(monitoring);
    }

    const criticalAlerts = reports.reduce((sum, r) => sum + (r.alerts?.filter(a => a.severity === 'critical').length || 0), 0);
    const urgentAlerts = reports.reduce((sum, r) => sum + (r.alerts?.filter(a => a.severity === 'high').length || 0), 0);

    return {
      reportId: uuidv4(),
      generatedAt: new Date().toISOString(),
      casesCovered: reports.length,
      criticalAlerts,
      urgentAlerts,
      cases: reports,
      summary: `${criticalAlerts} critical alert(s), ${urgentAlerts} urgent alert(s) generated for ${reports.length} case(s)`,
    };
  } catch (error) {
    console.error('Watchdog Report Generation Error:', error);
    return {
      reportId: uuidv4(),
      error: error.message,
      status: 'error',
    };
  }
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

export const watchdogAgent = {
  calculateStatutoryDeadlines,
  checkEscalationEligibility,
  generateFirstAppealPetition,
  monitorCaseAndAlert,
  generateWatchdogReport,
  ESCALATION_CONFIG,
};
