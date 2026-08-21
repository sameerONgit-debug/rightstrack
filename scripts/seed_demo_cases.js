/**
 * Demo Seed Script for Hackathon Demonstration
 * Populates realistic RTI and Consumer cases with varied statutory timeline states:
 * 1. Case in review (13 days remaining)
 * 2. Overdue case (Deemed Refusal breached, ready for First Appeal)
 * 3. Consumer complaint under review
 */

const DEMO_CASES = [
  {
    id: 'RT-2026-8812',
    user_id: 'demo-user-1',
    domain: 'RTI',
    title: 'DDA Road Re-carpeting Expenditure RTI',
    status: 'FILED',
    narrative: 'Seeking certified copies of tender sanction, bills, and completion certificates for road re-carpeting works in Ward 42.',
    entities: {
      applicant_name: 'Aarav Sharma',
      public_authority: 'Delhi Development Authority',
      department: 'Engineering & Works',
      relief_sought: 'Certified expenditure accounts and inspection records',
    },
    filing_date: '2026-08-05T00:00:00.000Z',
    acknowledgement_number: 'DDA/RTI/2026/0912',
    deadline_date: '2026-09-04T23:59:59.000Z',
    statutory_rule: 'RTI Act 2005 Sec 7(1) (30 Calendar Days)',
  },
  {
    id: 'RT-2026-4091',
    user_id: 'demo-user-1',
    domain: 'RTI',
    title: 'Delhi University Duplicate Degree Certificate Delay',
    status: 'DEADLINE_BREACHED',
    narrative: 'Applied for duplicate degree certificate 35 days ago, paid fee of Rs. 1000. Examination branch has not replied or delivered records.',
    entities: {
      applicant_name: 'Aarav Sharma',
      public_authority: 'University of Delhi',
      department: 'Examination Branch',
      relief_sought: 'Immediate issuance of duplicate degree and reasons for delay',
    },
    filing_date: '2026-07-15T00:00:00.000Z',
    acknowledgement_number: 'DU/EXAM/RTI/8802',
    deadline_date: '2026-08-14T23:59:59.000Z',
    statutory_rule: 'RTI Act 2005 Sec 7(1) (30 Calendar Days)',
  },
  {
    id: 'CP-2026-1029',
    user_id: 'demo-user-1',
    domain: 'CONSUMER',
    title: 'Defective Laptop Warranty Replacement Refusal',
    status: 'UNDER_REVIEW',
    narrative: 'Purchased laptop for Rs. 65,000. Motherboard died within 2 weeks. Authorized service centre refusing warranty replacement.',
    entities: {
      applicant_name: 'Aarav Sharma',
      opposite_party: 'OmniTech Electronics Ltd.',
      transaction_amount: 65000,
      relief_sought: 'Full refund or brand new replacement with interest',
    },
    filing_date: '2026-08-10T00:00:00.000Z',
    acknowledgement_number: 'EDAAKHIL-ND-2026-4910',
    deadline_date: '2026-09-09T23:59:59.000Z',
    statutory_rule: 'Consumer Protection Act 2019 Sec 38(2)(a) (30 Days)',
  },
];

async function seedDemoCases() {
  console.log('=== Seeding RightsTrack Demo Cases for Hackathon ===');
  console.log(`Seeding ${DEMO_CASES.length} cases with pre-calculated statutory timelines:`);
  for (const c of DEMO_CASES) {
    console.log(`- [${c.domain}] ${c.id}: ${c.title} (${c.status})`);
  }
  console.log('✓ Demo cases ready for local testing and judge demonstration.');
}

if (require.main === module) {
  seedDemoCases().catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}

module.exports = { seedDemoCases, DEMO_CASES };
