import { calculateLegalDeadline } from './deadline-calculator';
import { CASE_STATES, validateTransition } from './state-machine';

/**
 * Case Service — Encapsulates case business logic, deadline monitoring, and transitions.
 */
export class CaseService {
  static createCase({ domain, title, narrative, entities, userId = 'anon-user' }) {
    const caseId = `rt-${Date.now().toString(36)}`;
    return {
      id: caseId,
      user_id: userId,
      domain,
      title: title || `${domain} Case - ${new Date().toLocaleDateString()}`,
      status: CASE_STATES.DRAFTING,
      narrative,
      entities,
      filing_date: null,
      deadline_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  static recordFiling(caseRecord, filingDate, acknowledgementNumber) {
    validateTransition(caseRecord.status, CASE_STATES.FILED);

    const deadlineInfo = calculateLegalDeadline(filingDate, caseRecord.domain);

    return {
      ...caseRecord,
      status: CASE_STATES.FILED,
      filing_date: filingDate,
      acknowledgement_number: acknowledgementNumber,
      deadline_date: deadlineInfo.deadlineDate.toISOString(),
      statutory_rule: deadlineInfo.statutoryRule,
      updated_at: new Date().toISOString(),
    };
  }

  static checkCaseDeadline(caseRecord) {
    if (!caseRecord.filing_date || caseRecord.status === CASE_STATES.RESOLVED) {
      return caseRecord;
    }

    const deadlineInfo = calculateLegalDeadline(caseRecord.filing_date, caseRecord.domain);

    if (deadlineInfo.isBreached && caseRecord.status !== CASE_STATES.DEADLINE_BREACHED && caseRecord.status !== CASE_STATES.ESCALATED) {
      return {
        ...caseRecord,
        status: CASE_STATES.DEADLINE_BREACHED,
        is_breached: true,
        days_remaining: 0,
        updated_at: new Date().toISOString(),
      };
    }

    return {
      ...caseRecord,
      days_remaining: deadlineInfo.daysRemaining,
      is_breached: deadlineInfo.isBreached,
    };
  }
}
