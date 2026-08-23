# RightsTrack — Hackathon Demo Script (3-Minute Judge Pitch)

> **Theme**: Problem Statement PS3 — AI for Civic & Legal Empowerment.
> **Key Differentiator**: RightsTrack is a case *tracker* with auto-calculated statutory deadlines and automated escalation drafting, not just a static document generator.

---

## 🕒 Timing Breakdown (Total: 3 mins)

### 0:00 – 0:30 | The Hook & Problem
- **Speaker**: "In India, over 6 million RTIs and 500,000 consumer complaints are filed every year. But over 40% of citizens abandon their cases when authorities don't reply in time. Why? Because existing AI legal tools stop at generating a PDF. The citizen has no idea when the legal deadline passes, what 'deemed refusal' means, or how to file a First Appeal. RightsTrack solves this — describe your problem once, get the right legal document, and never miss a deadline again."

### 0:30 – 1:15 | Conversational Intake & Grounded Drafting
- **Action**: Open RightsTrack home (`/`) and navigate to `/intake`.
- **Demo Input**: *"I applied for a duplicate degree certificate from Delhi University 60 days ago. Paid the fee of Rs. 1,000. No response, and college clerk refuses to answer."*
- **Action**: Click **Analyze Problem**.
- **Showcase**:
  1. Instant domain classification: **RTI Act, 2005** (Delhi University is a public authority under Sec 2(h)).
  2. Entity extraction: University name, applicant details, fee paid.
  3. Interactive clarification modal.
  4. Generation of a formal RTI application with **clickable blue citation badges** (`[RTI-SEC-6(1)]`, `[RTI-SEC-7(1)]`).
  5. Click a citation to show the **Source Statute Inspector** proving every section is grounded in real law, verified by our anti-hallucination engine.

### 1:15 – 2:00 | Real-Time Case Dashboard & Statutory Deadline Engine
- **Action**: Navigate to `/dashboard` or `/case/[caseId]`.
- **Showcase**:
  1. Case is opened with an exact **30-day legal countdown timer** under RTI Act Section 7(1).
  2. Live progress bar showing days elapsed vs remaining.
  3. Point out: *"Our deadline math is 100% deterministic code — never hallucinated by an LLM."*

### 2:00 – 2:40 | The Magic Moment: Automated Escalation (Deemed Refusal)
- **Action**: Switch to a pre-seeded overdue demo case (e.g. Case #RT-4091 where 32 days have passed with no response).
- **Showcase**:
  1. Status turns to high-visibility amber/red: **DEADLINE BREACHED (Deemed Refusal under Sec 7(2))**.
  2. System automatically generates a **Pre-drafted First Appeal under Section 19(1)** addressed to the First Appellate Authority.
  3. One click to inspect appeal grounds, statutory citations, and filing instructions.

### 2:40 – 3:00 | Conclusion & Impact
- **Speaker**: "RightsTrack transforms legal helplessness into structured, accountable civic action. Built on Next.js, Supabase pgvector, Voyage AI embeddings, and Claude 3.5 Sonnet with code-enforced anti-hallucination validation. Thank you."
