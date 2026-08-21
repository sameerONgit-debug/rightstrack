/**
 * Deterministic Legal Deadline Calculator
 * 
 * CRITICAL SAFETY REQUIREMENT:
 * This module calculates all statutory legal response windows using deterministic
 * JavaScript date math. Under no circumstances should date or deadline calculations
 * be delegated to an LLM.
 */

export const STATUTORY_PERIODS = {
  RTI_STANDARD_DAYS: 30,           // RTI Act Section 7(1)
  RTI_LIFE_LIBERTY_HOURS: 48,      // RTI Act Section 7(1) Proviso
  RTI_FIRST_APPEAL_DAYS: 30,       // RTI Act Section 19(1)
  RTI_FIRST_APPEAL_MAX_DAYS: 45,   // RTI Act Section 19(6)
  CONSUMER_RESPONSE_DAYS: 30,      // Consumer Protection Act Section 38(2)(a)
  CONSUMER_EXTENSION_DAYS: 15,     // Consumer Protection Act Section 38(2)(a) Proviso
};

/**
 * Calculates deadline date and days remaining based on filing date and domain.
 * 
 * @param {string | Date} filingDateStr - ISO date or Date object
 * @param {string} domain - 'RTI' | 'CONSUMER'
 * @param {boolean} isLifeOrLiberty - Special 48h emergency provision
 * @returns {{ deadlineDate: Date, daysRemaining: number, isBreached: boolean, statutoryRule: string }}
 */
export function calculateLegalDeadline(filingDateStr, domain = 'RTI', isLifeOrLiberty = false) {
  const filingDate = new Date(filingDateStr);
  if (isNaN(filingDate.getTime())) {
    throw new Error('Invalid filing date provided to calculateLegalDeadline');
  }

  const deadlineDate = new Date(filingDate);

  let statutoryRule = '';
  if (domain === 'RTI') {
    if (isLifeOrLiberty) {
      deadlineDate.setHours(deadlineDate.getHours() + STATUTORY_PERIODS.RTI_LIFE_LIBERTY_HOURS);
      statutoryRule = 'RTI Act 2005 Sec 7(1) Proviso (48 Hours for Life/Liberty)';
    } else {
      deadlineDate.setDate(deadlineDate.getDate() + STATUTORY_PERIODS.RTI_STANDARD_DAYS);
      statutoryRule = 'RTI Act 2005 Sec 7(1) (30 Calendar Days)';
    }
  } else {
    // Consumer Protection Act
    deadlineDate.setDate(deadlineDate.getDate() + STATUTORY_PERIODS.CONSUMER_RESPONSE_DAYS);
    statutoryRule = 'Consumer Protection Act 2019 Sec 38(2)(a) (30 Days)';
  }

  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isBreached = diffMs < 0;

  return {
    deadlineDate,
    daysRemaining: isBreached ? 0 : daysRemaining,
    isBreached,
    statutoryRule,
  };
}
