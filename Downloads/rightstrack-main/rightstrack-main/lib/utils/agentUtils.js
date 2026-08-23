import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Agent Utilities & Helper Functions
 * Shared utilities across all autonomous agents
 */

/**
 * Logging utility for agent operations
 */
export const agentLogger = {
  info: (agent, message, data = {}) => {
    console.log(`[${agent}] ${message}`, data);
  },
  error: (agent, message, error) => {
    console.error(`[${agent}] ERROR: ${message}`, error);
  },
  warn: (agent, message, data = {}) => {
    console.warn(`[${agent}] WARNING: ${message}`, data);
  },
  debug: (agent, message, data = {}) => {
    if (process.env.DEBUG === 'true') {
      console.debug(`[${agent}] DEBUG: ${message}`, data);
    }
  },
};

/**
 * Get domain-specific configuration
 */
export const getDomainConfig = (domain) => {
  const configs = {
    RTI: {
      name: 'Right to Information Act 2005',
      abbreviation: 'RTI',
      statute: 'Right to Information Act, 2005',
      responseDeadline: 45,
      firstAppealDeadline: 45,
      secondAppealDeadline: 90,
      keywords: ['information', 'access', 'document', 'request', 'public authority', 'pio'],
      requiredFields: ['publicAuthorityName', 'informationSought', 'referencedActs', 'urgency'],
      escalationLevels: [
        { level: 1, authority: 'State Information Commission', daysAllowed: 45 },
        { level: 2, authority: 'Central Information Commission', daysAllowed: 90 },
      ],
    },
    CONSUMER: {
      name: 'Consumer Protection Act 2019',
      abbreviation: 'CPA',
      statute: 'Consumer Protection Act, 2019',
      responseDeadline: 30,
      firstAppealDeadline: 30,
      secondAppealDeadline: 60,
      keywords: ['defect', 'product', 'complaint', 'refund', 'consumer', 'seller', 'manufacturer'],
      requiredFields: ['sellerName', 'productDetails', 'defectDescription', 'invoiceAmount', 'demandedRelief'],
      escalationLevels: [
        { level: 1, authority: 'District Consumer Commission', daysAllowed: 30 },
        { level: 2, authority: 'State Consumer Commission', daysAllowed: 60 },
        { level: 3, authority: 'National Consumer Redressal Commission', daysAllowed: Infinity },
      ],
    },
    CYBER_FRAUD: {
      name: 'IT Act 2000 & Cyber Crime',
      abbreviation: 'IT',
      statute: 'Information Technology Act, 2000',
      responseDeadline: 60,
      firstAppealDeadline: 30,
      secondAppealDeadline: 90,
      keywords: ['fraud', 'cyber', 'hack', 'phishing', 'identity theft', 'malware', 'scam'],
      requiredFields: ['fraudDescription', 'amountLost', 'evidenceType', 'incidentDate', 'bankDetails'],
      escalationLevels: [
        { level: 1, authority: 'State Cyber Crime Cell', daysAllowed: 30 },
        { level: 2, authority: 'Central Bureau of Investigation', daysAllowed: 60 },
      ],
    },
    MUNICIPAL: {
      name: 'Municipal Civic Grievance',
      abbreviation: 'CIVIC',
      statute: '12th Schedule, Constitution of India',
      responseDeadline: 15,
      firstAppealDeadline: 30,
      secondAppealDeadline: 45,
      keywords: ['pothole', 'street light', 'water', 'sanitation', 'infrastructure', 'civic', 'municipal'],
      requiredFields: ['grievanceCategory', 'location', 'description', 'daysUnresolved', 'evidencePhotos'],
      escalationLevels: [
        { level: 1, authority: 'Ward Officer', daysAllowed: 15 },
        { level: 2, authority: 'Zonal Commissioner', daysAllowed: 30 },
        { level: 3, authority: 'Municipal Commissioner', daysAllowed: 45 },
      ],
    },
  };

  return configs[domain.toUpperCase()] || null;
};

/**
 * Save agent operation to database for audit and monitoring
 */
export const logAgentOperation = async (operation) => {
  try {
    const { data, error } = await supabase
      .from('agent_operations_log')
      .insert([
        {
          id: uuidv4(),
          agent_name: operation.agent,
          operation_type: operation.type,
          input_data: operation.input,
          output_data: operation.output,
          status: operation.status || 'success',
          execution_time_ms: operation.executionTime,
          error_message: operation.error || null,
          case_id: operation.caseId || null,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      agentLogger.warn('LogAgent', 'Failed to log operation', { error });
    }
  } catch (err) {
    agentLogger.error('LogAgent', 'Exception in logging', err);
  }
};

/**
 * Get agent performance metrics
 */
export const getAgentMetrics = async (agentName, timeRange = '7d') => {
  try {
    const now = new Date();
    const days = parseInt(timeRange);
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('agent_operations_log')
      .select('agent_name, status, execution_time_ms')
      .eq('agent_name', agentName)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    return {
      totalOperations: data.length,
      successCount: data.filter((d) => d.status === 'success').length,
      errorCount: data.filter((d) => d.status === 'error').length,
      avgExecutionTime: data.reduce((sum, d) => sum + (d.execution_time_ms || 0), 0) / data.length,
      timeRange,
    };
  } catch (err) {
    agentLogger.error('MetricsAgent', 'Failed to get metrics', err);
    return null;
  }
};

/**
 * Classify text into legal domain using keyword matching
 */
export const classifyDomainByKeywords = (text) => {
  const domains = ['RTI', 'CONSUMER', 'CYBER_FRAUD', 'MUNICIPAL'];
  const scores = {};

  domains.forEach((domain) => {
    const config = getDomainConfig(domain);
    const keywords = config.keywords;
    const textLower = text.toLowerCase();

    scores[domain] = keywords.filter((kw) =>
      textLower.includes(kw.toLowerCase())
    ).length;
  });

  const topDomain = Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0];
  const maxScore = Math.max(...Object.values(scores));

  return {
    domain: topDomain,
    confidence: maxScore > 0 ? maxScore / 10 : 0,
    scores,
  };
};

/**
 * Calculate escalation deadline
 */
export const calculateEscalationDeadline = (domain, filingDate) => {
  const config = getDomainConfig(domain);
  if (!config) return null;

  const deadlines = config.escalationLevels.map((level) => {
    const deadline = new Date(filingDate);
    deadline.setDate(deadline.getDate() + level.daysAllowed);

    return {
      level: level.level,
      authority: level.authority,
      deadline: deadline.toISOString().split('T')[0],
      daysRemaining: Math.floor(
        (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
      isOverdue: deadline < new Date(),
      isUrgent: Math.floor(
        (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ) <= 7,
    };
  });

  return deadlines;
};

/**
 * Validate case data completeness
 */
export const validateCaseCompleteness = (domain, caseData) => {
  const config = getDomainConfig(domain);
  if (!config) return { valid: false, missing: ['invalid domain'] };

  const missing = config.requiredFields.filter(
    (field) => !caseData[field] || caseData[field] === ''
  );

  const coverage = Math.round(
    ((config.requiredFields.length - missing.length) /
      config.requiredFields.length) *
      100
  );

  return {
    valid: missing.length === 0,
    coverage,
    missing,
    requiredFields: config.requiredFields,
  };
};

/**
 * Get jurisdiction authority for domain
 */
export const getJurisdictionAuthority = (domain, escalationLevel) => {
  const config = getDomainConfig(domain);
  if (!config) return null;

  const level = config.escalationLevels.find((l) => l.level === escalationLevel);
  return level ? level.authority : null;
};

/**
 * Format case data for document generation
 */
export const formatCaseDataForDocument = (caseData, domain) => {
  const config = getDomainConfig(domain);

  return {
    statute: config.statute,
    domain: config.name,
    caseNumber: caseData.caseNumber || `CASE-${Date.now()}`,
    filingDate: caseData.filingDate || new Date().toISOString().split('T')[0],
    ...caseData,
  };
};

/**
 * Check if appeal is eligible
 */
export const checkAppealEligibility = (domain, caseStatus, daysElapsed) => {
  const config = getDomainConfig(domain);
  if (!config) return { eligible: false, reason: 'Invalid domain' };

  const minDaysBeforeAppeal = 1;
  const maxDaysBeforeAppeal = config.firstAppealDeadline + 30;

  if (daysElapsed < minDaysBeforeAppeal) {
    return {
      eligible: false,
      reason: `Must wait at least ${minDaysBeforeAppeal} day(s) before filing appeal`,
    };
  }

  if (daysElapsed > maxDaysBeforeAppeal) {
    return {
      eligible: false,
      reason: `Appeal deadline (${config.firstAppealDeadline} days) has passed`,
    };
  }

  return {
    eligible: true,
    reason: 'Appeal eligibility criteria met',
  };
};

export default {
  agentLogger,
  getDomainConfig,
  logAgentOperation,
  getAgentMetrics,
  classifyDomainByKeywords,
  calculateEscalationDeadline,
  validateCaseCompleteness,
  getJurisdictionAuthority,
  formatCaseDataForDocument,
  checkAppealEligibility,
};
