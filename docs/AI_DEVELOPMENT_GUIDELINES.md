# RightsTrack — AI & Team Development Guidelines

> **Purpose**: This document establishes strict architectural boundaries, safety constraints, and collaboration protocols for human developers and AI coding agents (Claude, Gemini, Antigravity, GitHub Copilot). These rules prevent merge collisions, preserve API integrity, and uphold our core safety guarantees for judges and end users.

---

## 1. Module Ownership Boundaries

To enable seamless parallel development across a 3-person team with AI agents, the codebase is partitioned into three non-overlapping domains. **Never write across domain boundaries in a single PR.**

| Domain | Allowed File Paths | Lead Role | Primary Responsibilities |
|---|---|---|---|
| **Frontend & UX** | `/app/**` (excluding `/app/api/**`), `/components/**`, `/styles/**`, `/public/**` | Frontend Lead | User interface, stateful intake wizard, visual deadline counters, citation inspect modals, dynamic escalation alerts, responsive layouts. |
| **Backend, Data & State** | `/app/api/**`, `/lib/cases/**`, `/lib/supabase/**`, `/scripts/**` | Backend Lead | Next.js route handlers, Supabase client/server singletons, PostgreSQL schema, RLS policies, rule-based case state machines, deadline math. |
| **AI, RAG & Legal Intelligence** | `/lib/ai/**`, `/lib/rag/**`, `/knowledge-base/**`, `/lib/documents/**` | AI/RAG Lead | Claude 3.5 prompt engineering, Voyage AI vector retrieval, knowledge base ingestion, AST/regex citation verification, draft formatting. |

---

## 2. The Non-Negotiable Safety Rules

These three invariant rules protect the integrity of the civic empowerment mission:

### 1. Retrieval-Only Citations Enforced by Code (Never Prompting Alone)
- Legal document generation must be grounded in verified legal statutes (RTI Act 2005, Consumer Protection Act 2019).
- **Hard Guardrail**: Citations (e.g., `[RTI-SEC-6(1)]`, `[CPA-SEC-2(47)]`) embedded in drafted documents must be validated deterministically by `lib/rag/validator.js`.
- If an LLM attempts to generate a hallucinated citation key that does not exist in the retrieved passage vector chunk ID list, `validator.js` **must fail closed or strip the ungrounded citation**.
- *Never remove or bypass this validation step to "simplify" a workflow.*

### 2. Rule-Based Legal Deadline Calculation (Never Call an LLM for Date Math)
- Legal time limits under Indian civic law are statutory and deterministic:
  - RTI Standard Response: **30 calendar days** (Section 7(1)).
  - RTI Life and Liberty: **48 hours** (Section 7(1) proviso).
  - RTI First Appeal Filing Window: **30 days** post-PIO failure (Section 19(1)).
  - Consumer Complaint Response: **30 days** (+15 days extension maximum) (Section 38(2)(a)).
- All deadline calculations **must execute purely through `lib/cases/deadline-calculator.js`** using standard JavaScript `Date` arithmetic.
- **Never prompt an LLM to "estimate" or "predict" a deadline.**

### 3. Invariant Legal Disclaimers
- The text in `components/LegalDisclaimer.jsx` informs citizens that RightsTrack provides legal drafting and procedural tracking assistance, not formal legal representation.
- The disclaimer must remain visible on all document generation and export screens.

---

## 3. Strict Human-Approval Requirements

The following items are **locked** and cannot be altered by an AI assistant or human contributor without explicit team agreement:

1. **Deterministic Citation Validator** (`lib/rag/validator.js`): Any alteration to the validation algorithm or schema.
2. **Statutory Date Calculations** (`lib/cases/deadline-calculator.js`): Any modification to statutory time windows.
3. **Documented API Request/Response Contracts** (`docs/mvp-spec.md`): Endpoints are frozen; frontend and backend build against these contracts.
4. **Database Schema & Migrations** (`lib/supabase/schema.sql`): Table names, column types, and foreign key relations.
5. **Legal Disclaimer Copy** (`components/LegalDisclaimer.jsx`).

---

## 4. API Contract & Integration Policy

1. Every route inside `/app/api/` must strictly adhere to the schemas defined in [`docs/mvp-spec.md`](./mvp-spec.md).
2. If a frontend requirement necessitates changing an API payload:
   - First update [`docs/mvp-spec.md`](./mvp-spec.md).
   - Post an issue / notify teammates.
   - Update the backend handler and test before consuming it on the frontend.
3. All API routes must return standard JSON envelopes:
   ```json
   // Success response
   {
     "success": true,
     "data": { ... },
     "error": null
   }

   // Error response
   {
     "success": false,
     "data": null,
     "error": {
       "code": "INVALID_CASE_STATE",
       "message": "Human-readable error explanation"
     }
   }
   ```

---

## 5. Git & Branching Strategy

- `main` is the production branch and is protected.
- Work branches follow the naming pattern:
  - `feature/<domain>-<feature-name>` (e.g. `feature/frontend-case-dashboard`, `feature/ai-reranker`)
  - `fix/<domain>-<issue-name>` (e.g. `fix/rag-citation-regex`)
- Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
  - `feat:` for new capabilities
  - `fix:` for bug fixes
  - `docs:` for documentation updates
  - `refactor:` for code restructurings
  - `test:` for test additions/adjustments
  - `chore:` for tooling, dependencies, and repo housekeeping
