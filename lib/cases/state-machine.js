/**
 * Case State Machine & Lifecycle Transitions
 */

export const CASE_STATES = {
  DRAFTING: 'DRAFTING',
  READY_TO_FILE: 'READY_TO_FILE',
  FILED: 'FILED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  DEADLINE_BREACHED: 'DEADLINE_BREACHED',
  ESCALATED: 'ESCALATED',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
};

const ALLOWED_TRANSITIONS = {
  [CASE_STATES.DRAFTING]: [CASE_STATES.READY_TO_FILE, CASE_STATES.CANCELLED],
  [CASE_STATES.READY_TO_FILE]: [CASE_STATES.FILED, CASE_STATES.CANCELLED],
  [CASE_STATES.FILED]: [CASE_STATES.UNDER_REVIEW, CASE_STATES.DEADLINE_BREACHED, CASE_STATES.RESOLVED],
  [CASE_STATES.UNDER_REVIEW]: [CASE_STATES.DEADLINE_BREACHED, CASE_STATES.RESOLVED],
  [CASE_STATES.DEADLINE_BREACHED]: [CASE_STATES.ESCALATED, CASE_STATES.RESOLVED],
  [CASE_STATES.ESCALATED]: [CASE_STATES.RESOLVED, CASE_STATES.CANCELLED],
  [CASE_STATES.RESOLVED]: [],
  [CASE_STATES.CANCELLED]: [],
};

export function canTransition(currentState, nextState) {
  const allowed = ALLOWED_TRANSITIONS[currentState] || [];
  return allowed.includes(nextState);
}

export function validateTransition(currentState, nextState) {
  if (!canTransition(currentState, nextState)) {
    throw new Error(`Invalid case state transition from ${currentState} to ${nextState}`);
  }
  return true;
}
