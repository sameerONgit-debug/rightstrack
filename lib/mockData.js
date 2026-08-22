/**
 * Hour-0 Mock Data matching Section 4 & 6 of MVP Spec.
 * Used for front-end development before backend endpoints are live.
 */

export const mockAnalyzeRTI = {
  domain: "RTI",
  confidence: 0.94,
  rationale: "Issue involves delayed government farmer subsidy payout from block office.",
  extracted_fields: {
    authority: "Block Development Office",
    scheme_name: "PM-KISAN",
    months_delayed: 3
  },
  clarifying_questions: [
    { field_key: "applicant_name", question_text: "What is your full legal name as per government records?", input_type: "text" },
    { field_key: "pso_address", question_text: "Which Public Information Officer / Block Office are you addressing?", input_type: "text" },
    { field_key: "application_fee_details", question_text: "How will you pay the ₹10 RTI application fee?", input_type: "select" }
  ]
};

export const mockAnalyzeConsumer = {
  domain: "Consumer",
  confidence: 0.91,
  rationale: "Defective product received with refusal of refund by online seller.",
  extracted_fields: {
    product_name: "Pressure Cooker",
    purchase_amount: 2400,
    defect_description: "Cracked lid"
  },
  clarifying_questions: [
    { field_key: "seller_name", question_text: "What is the official registered name of the online seller?", input_type: "text" },
    { field_key: "order_id", question_text: "What is your order / invoice number?", input_type: "text" },
    { field_key: "purchase_date", question_text: "When was the purchase made?", input_type: "date" }
  ]
};

export const mockAnalyzeUnsupported = {
  domain: "Unsupported",
  confidence: 0.88,
  rationale: "Tenant eviction disputes are governed by state Rent Control Acts.",
  extracted_fields: {},
  clarifying_questions: []
};

export const mockCasesList = {
  cases: [
    {
      id: "case_rti_001",
      domain: "RTI",
      status: "filed",
      deadline_date: "2026-09-22",
      days_remaining: 30,
      title: "PM-KISAN Farmer Subsidy Non-Payment Inquiry"
    },
    {
      id: "case_rti_002",
      domain: "RTI",
      status: "overdue",
      deadline_date: "2026-08-15",
      days_remaining: -8,
      title: "PM-KISAN Pending Installment - Overdue Appeal"
    },
    {
      id: "case_consumer_001",
      domain: "Consumer",
      status: "drafted",
      deadline_date: null,
      days_remaining: null,
      title: "Defective Pressure Cooker Refund Complaint"
    }
  ]
};
