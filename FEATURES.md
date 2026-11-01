# HandoverIQ: Working Features Verification

All features listed below are fully implemented, verified, and operational in HandoverIQ:

### 1. Ingestion & Pre-Processing
- [x] **Load Demo Project:** One-click loading of the "TechFest 2026 Registration Platform" synthetic dataset (6 realistic sources).
- [x] **File Upload:** Uploads `.md`, `.txt`, `.csv`, and `.json` documents with auto-detection of source type (repo, tasks, notes, chat, doc).
- [x] **Custom Source Creator:** Manual addition of meeting notes, incident chat snippets, or architecture decision records.
- [x] **Uniform Span Chunking:** Chunks content into stable, deterministic ~10-line spans (`S1-C1`, `S2-C3`) with line ranges.
- [x] **Automated Secrets Redaction:** Regex engine masks Razorpay keys (`rzp_*`), Google API keys (`AIza*`), GitHub tokens (`ghp_*`), OpenAI keys (`sk-*`), email addresses, phone numbers, and lines tagged `[CONFIDENTIAL]`.
- [x] **Redaction Stats Counter:** Live breakdown pill showing the total number of redacted secrets and their types.

### 2. Permissions & Security
- [x] **4 Simulated Roles:** Admin, Outgoing Member (Rohan Mehta), Reviewer / Lead (Priya Nair), and Incoming Member (Ananya Rao).
- [x] **Header Role Switcher:** Switch between roles in 1 click with zero login required.
- [x] **Pre-AI Permission Gate:** Chunks that exceed the active user's clearance are filtered out before sending data to Gemini.
- [x] **Incoming Member Obfuscation:** In the incoming member view, items supported by higher-clearance sources (e.g., lead-only financial agreements) are masked as:
  `"1 item hidden: requires higher access"` without leaking title, content, or source.

### 3. Reconstruction & AI Extraction
- [x] **Server-Side Gemini Integration:** Express endpoint `/api/gemini/reconstruct` calling `gemini-2.5-flash` with automatic fallback to `gemini-3.8-flash`.
- [x] **Strict JSON Response Schema:** Enforces structured extraction using `@google/genai` `Type` enum.
- [x] **Extraction Categories:** Architectural decisions with underlying WHY, active risks, recurring problems with known fixes, key contacts ("who to ask for what"), timeline, and next actions.
- [x] **Cached Demo Result Fallback:** "Use Cached Demo Result" button provides an instant, zero-latency synthetic reconstruction for judges.

### 4. Deterministic Code Verification
- [x] **Code-Based String Matcher:** Normalised verbatim string validation against authoritative source chunks (case-insensitive, whitespace-collapsed, token ratio checks).
- [x] **Verification Badges:**
  - **Verified (Emerald):** Exact quote found in cited chunk.
  - **Partial (Amber):** Weak token match or single unconfirmed chat mention.
  - **Unverified (Slate):** Quote not found in chunk (marked "No evidence found").
  - **Conflicting (Rose):** Contradictory claims between sources.
- [x] **Verification Safeguard:** Claims whose citations fail validation are never shown as Verified.
- [x] **Interactive Evidence Drawer:** Clicking any citation pill opens the source chunk, highlights the exact quote in amber/emerald, and displays match scores.

### 5. Review & Approval Gate
- [x] **Approval Gating:** The handover plan cannot be accessed by incoming members until approved by a Reviewer or Admin.
- [x] **Gap Question Attestation:** Identifies missing information (e.g. unassigned renewal owner); allows human reviewers to submit attestations.
- [x] **Contradiction Resolver:** Displays side-by-side conflicting evidence (Task board claiming "Done" vs Repo/Notes showing unfinished branch `feature/waitlist`) with official reviewer resolution.
- [x] **Claim Moderation:** Reviewers can Edit, Reject, or Approve each individual claim.
- [x] **Immutable Version Creation:** Approving stamps a new version (v1.0, v2.0) with reviewer name and ISO timestamp.

### 6. Handover Continuation & Sign-off
- [x] **Role-Tailored Executive Plan:** Curated onboarding overview for incoming engineers.
- [x] **First-Week Onboarding Checklist:** Prioritized checklist of tasks and verifications.
- [x] **Incident Response Runbooks:** Recurring problem guide with exact 45-second recovery procedures.
- [x] **Key Contacts Directory:** Directory of who to contact for sponsorship, DNS, SSL, and server room access.
- [x] **Ownership & Task Matrix:** Tabular view of upcoming milestones and assignments.
- [x] **Acknowledge Receipt:** Incoming member can click "Acknowledge Receipt" to sign off on the handover.
- [x] **Exports:** Download complete continuation plan as Markdown (with citation footnotes) or JSON.
- [x] **Immutable Audit Trail:** Complete audit log of all system events with CSV export.
