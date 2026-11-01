# HandoverIQ: Evidence-Linked, Permission-Aware Knowledge Handover

> *Deterministic ground-truth project state transfer with verifiable source citations and pre-AI permission gating.*

---

## 1. Description & Problem Solved

When an engineering or product team member departs, crucial tribal knowledge disappears:
- Why critical architectural decisions were made (the **WHY**).
- Hidden dependencies and incomplete branches.
- Recurring operational failures and their exact recovery steps.
- Who to contact for specific domain authorizations.

Standard generative AI summaries hallucinate facts, invent explanations, offer zero verifiable proof, and routinely leak sensitive credentials.

**HandoverIQ** is an evidence-linked, permission-aware handover platform. It reads authorized sources, reconstructs the project's current state, links **EVERY claim to verbatim evidence**, flags gaps and source conflicts rather than guessing, requires human sign-off, and strictly shows each team member only what their security clearance permits.

---

## 2. Core Features

- **Connect & Ingest:** Ingests source repositories, CSV sprint boards, meeting notes, incident chat logs, and operational documentation. Automatically chunks into uniform spans with stable IDs (`S1-C1`, `S2-C3`).
- **Automated Secrets Redaction:** Scans and redacts live API keys (`rzp_*`, `AIza*`, `ghp_*`, `sk-*`), email addresses, phone numbers, and lines marked `[CONFIDENTIAL]` before storage or transmission.
- **Pre-AI Role Clearance Gate:** Enforces security filtering **BEFORE** data reaches the model. Chunks above the active role's clearance are never transmitted.
- **Gemini Structured Extraction:** Extracts structured decisions with underlying rationale, owners, recurring problems and fixes, contacts, timelines, explicit knowledge gaps, and source contradictions.
- **Deterministic Code Verification:** Evaluates 100% of claims in code (non-AI) using normalized verbatim string comparison. Claims that fail verification are never marked as Verified.
- **Evidence Inspector Drawer:** Allows instant inspection of any citation: reveals the authoritative source chunk with the exact quoted phrase highlighted in high-contrast styling and exact character match metrics.
- **Human-in-the-Loop Review Gate:** AI output is treated strictly as an unapproved draft. Reviewers can edit, reject, approve claims, resolve contradictions, and answer knowledge gaps. Handover continuation plans cannot be accessed by incoming members until approved.
- **Role-Tailored Continuation Plan:** Generates an executive roadmap for incoming engineers: first-week checklist, recurring incident runbooks, ownership matrix, and key contacts.
- **Access Obfuscation:** In the Incoming Member view, any item derived from higher clearances (e.g., lead-only financial agreements) is masked with an opaque security card: `1 item hidden: requires higher access` without leaking content or source title.
- **Immutable Version History & Acknowledgement:** Lead approvals generate versioned releases (v1.0, v2.0). Incoming members can record formal sign-off ("Acknowledge receipt").
- **Audit Trail & Export:** Full activity logging of all role switches, inspections, edits, approvals, and acknowledgements. Exportable as Markdown (with citation footnotes) or JSON.

---

## 3. Technology Stack

- **Frontend:** React 19 SPA, TypeScript 7.0, Tailwind CSS v4, Lucide Icons
- **Backend / API:** Node.js Express, Vite Middleware Integration
- **AI Engine:** Google Gemini 2.5 / 3.8 Flash via modern `@google/genai` TypeScript SDK
- **Data Persistence:** LocalStorage with schema versioning, audit trail, and instant demo reset

---

## 4. Architecture & Data Flow

```
[ Authorized Sources ] (Repo, CSV Tasks, Meeting Notes, Slack Chat, Ops Docs)
        │
        ▼
[ Ingestion & Stable Chunking ] (Uniform ~10-line spans: S1-C1, S2-C2...)
        │
        ▼
[ Secrets Redaction Layer ] (Regex sanitizes API keys, emails, phones, [CONFIDENTIAL])
        │
        ▼
[ Pre-AI Permission Gate ] (Filters out chunks exceeding active user role clearance)
        │
        ▼
[ Gemini Structured Extraction ] (JSON schema: Decisions + WHY, Gaps, Contradictions)
        │
        ▼
[ Deterministic Quote Verification ] (Code-level normalized string match: Verified, Partial, Unverified)
        │
        ▼
[ Human Review & Gap Resolution ] (Reviewer edits, resolves gaps, resolves conflicts)
        │
        ▼
[ Approval Gate (v1.0) ] (Generates immutable versioned snapshot)
        │
        ▼
[ Role-Based Continuation Plan ] (Tailored view: masks higher-clearance items for Incoming role)
        │
        ▼
[ Incoming Member Sign-off ] ("Acknowledge Receipt" recorded in audit trail)
```

---

## 5. Quick Run Instructions

1. **Clone & Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create `.env` in the project root:
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   PORT=3000
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Instant Zero-Setup Hackathon Mode:**
   Judges can immediately click **"Load demo project"** or **"Use Cached Demo Result"** to explore the entire 5-step workflow without any API key or setup required.

---

## 6. Known Limitations

- **Browser Storage:** Project state is persisted locally via `localStorage`. Clearing browser data resets to the default demo state.
- **Static File Ingestion:** Currently parses `.md`, `.txt`, `.csv`, and `.json` text files. Binary PDF extraction requires server-side document parsing.
