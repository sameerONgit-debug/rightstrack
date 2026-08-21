# RightsTrack — MVP Specification

> **Hackathon Scope**: 24-hour build, 3-person team. Problem Statement PS3: AI for Civic & Legal Empowerment.

---

## 1. System Overview

RightsTrack transforms citizen problem narratives into citation-grounded legal documents, activates real-time statutory deadline tracking, and automatically triggers pre-drafted escalation appeals when public authorities or corporations fail to respond in time.

```
Citizen Plain Text ──> [Domain Classifier] ──> RTI Request OR Consumer Complaint
                                │
                                └──> [RAG Retrieval & Citation Validation]
                                        │
                                        └──> [Grounded Legal Document]
                                                │
                                                └──> [Tracked Case + Deadline]
                                                        │
                                                        └──> [Automatic Escalation Draft]
```

---

## 2. Supported Legal Domains

### A. Right to Information (RTI Act, 2005)
- **Applicability**: Requests for information, public works inspection, records from government bodies / public authorities.
- **Key Statute**: Sections 6(1), 6(3), 7(1), 19(1).
- **Statutory Deadline**: 30 days from receipt (or 48 hours for life & liberty).
- **Escalation Mechanism**: First Appeal under Section 19(1) to First Appellate Authority (FAA).

### B. Consumer Protection (Consumer Protection Act, 2019)
- **Applicability**: Defective goods, deficiency in service, unfair trade practices, e-commerce refund failures.
- **Key Statute**: Sections 2(6), 2(11), 2(47), 35, 38.
- **Statutory Deadline**: 30 days for opposite party written response.
- **Escalation Mechanism**: Formal Notice of Non-Compliance & escalation to District Consumer Disputes Redressal Commission (DCDRC).

---

## 3. Case State Machine

```
[DRAFTING] ──> [READY_TO_FILE] ──> [FILED] ──> [UNDER_REVIEW]
                                       │              │
                                       │              ├──> [RESOLVED]
                                       │              │
                                       └──[DEADLINE_BREACHED] ──> [ESCALATED]
```

| State | Description | Next Allowed Transitions |
|---|---|---|
| `DRAFTING` | Case created, intake completed, AI drafting document | `READY_TO_FILE` |
| `READY_TO_FILE` | Citation-grounded document finalized and ready for citizen filing | `FILED`, `CANCELLED` |
| `FILED` | Citizen filed document and entered filing/acknowledgement date | `UNDER_REVIEW`, `RESOLVED`, `DEADLINE_BREACHED` |
| `UNDER_REVIEW` | Within statutory response window; waiting for authority reply | `RESOLVED`, `DEADLINE_BREACHED` |
| `DEADLINE_BREACHED` | Statutory deadline passed without response; triggers auto-escalation | `ESCALATED`, `RESOLVED` |
| `ESCALATED` | Appeal or formal non-compliance notice drafted and submitted | `RESOLVED`, `CLOSED` |
| `RESOLVED` | Information received or grievance redressed | None (Terminal) |
| `CANCELLED` | Abandoned by user | None (Terminal) |

---

## 4. API Endpoints Contract

### 1. `POST /api/analyze`
Classifies citizen problem narrative, extracts legal entities, and provides clarifying questions.

**Request Payload:**
```json
{
  "narrative": "I ordered a laptop for Rs. 65,000 from an online seller 45 days ago. The item was never delivered and customer service refused to refund.",
  "language": "en"
}
```

**Response Payload (200 OK):**
```json
{
  "success": true,
  "data": {
    "domain": "CONSUMER",
    "confidence": 0.96,
    "rationale": "Transaction involves purchase of goods with deficiency in service and refusal to refund under Consumer Protection Act 2019.",
    "entities": {
      "complainant_name": null,
      "opposite_party": "Online seller",
      "transaction_amount": 65000,
      "transaction_date": null,
      "relief_sought": "Full refund with interest"
    },
    "clarifications": [
      {
        "id": "order_id",
        "question": "What was the order ID or invoice number?",
        "required": true
      },
      {
        "id": "notice_sent",
        "question": "Have you sent any formal written email/notice to their grievance officer?",
        "required": false
      }
    ]
  },
  "error": null
}
```

---

### 2. `POST /api/cases`
Creates a tracked case and triggers citation-grounded document generation.

**Request Payload:**
```json
{
  "domain": "RTI",
  "narrative": "Seeking municipal road repair budget and expenditure records for Ward 42 for FY 2023-24.",
  "entities": {
    "applicant_name": "Rohan Sharma",
    "public_authority": "Municipal Corporation of Greater Mumbai",
    "department": "Roads & Traffic",
    "relief_sought": "Itemized accounts of tender sanction and contractor bills"
  }
}
```

**Response Payload (201 Created):**
```json
{
  "success": true,
  "data": {
    "case_id": "rt-8f92-411a",
    "status": "READY_TO_FILE",
    "domain": "RTI",
    "title": "Road Repair Expenditure RTI - Ward 42",
    "document": {
      "id": "doc-a19e-9901",
      "type": "RTI_APPLICATION",
      "content": "BEFORE THE PUBLIC INFORMATION OFFICER...\n\n1. Name of the Applicant: Rohan Sharma...",
      "citations": [
        {
          "id": "RTI-SEC-6-1",
          "statute": "Right to Information Act, 2005",
          "section": "Section 6(1)",
          "snippet": "A person, who desires to obtain any information under this Act, shall make a request in writing...",
          "verified": true
        }
      ]
    },
    "deadline": {
      "days_statutory": 30,
      "is_life_or_liberty": false,
      "status": "PENDING_FILING"
    },
    "created_at": "2026-08-22T00:00:00.000Z"
  },
  "error": null
}
```

---

### 3. `GET /api/cases`
Lists all tracked cases for the active session.

**Response Payload (200 OK):**
```json
{
  "success": true,
  "data": {
    "cases": [
      {
        "case_id": "rt-8f92-411a",
        "domain": "RTI",
        "title": "Road Repair Expenditure RTI - Ward 42",
        "status": "FILED",
        "filing_date": "2026-08-01T10:00:00.000Z",
        "deadline_date": "2026-08-31T23:59:59.000Z",
        "days_remaining": 9,
        "is_breached": false
      }
    ],
    "total": 1
  },
  "error": null
}
```

---

### 4. `GET /api/cases/:caseId`
Retrieves detailed case profile, active timeline, citations, and generated documents.

---

### 5. `PATCH /api/cases/:caseId`
Updates case status (e.g. marking as filed, recording receipt, or marking resolved).

**Request Payload:**
```json
{
  "status": "FILED",
  "filing_date": "2026-08-22T00:00:00.000Z",
  "acknowledgement_number": "RTI/MUM/2026/90218"
}
```

---

### 6. `POST /api/cases/:caseId/escalate`
Triggers statutory escalation when authority has failed to respond by deadline.

**Response Payload (200 OK):**
```json
{
  "success": true,
  "data": {
    "case_id": "rt-8f92-411a",
    "escalation_id": "esc-1092-bb81",
    "type": "RTI_FIRST_APPEAL",
    "grounds": "Deemed Refusal under Section 7(2) due to non-furnishing of information within 30 days under Section 7(1).",
    "appeal_document": {
      "id": "doc-esc-3312",
      "content": "BEFORE THE FIRST APPELLATE AUTHORITY...\n\nMemorandum of First Appeal under Section 19(1)...",
      "citations": [
        {
          "id": "RTI-SEC-19-1",
          "statute": "Right to Information Act, 2005",
          "section": "Section 19(1)",
          "snippet": "Any person who, does not receive a decision within the time specified in sub-section (1)...",
          "verified": true
        }
      ]
    },
    "new_deadline_days": 30
  },
  "error": null
}
```

---

### 7. `GET /api/sources/:documentId`
Fetches verified source legal chunks, statutes, and citations referenced in a legal document.
