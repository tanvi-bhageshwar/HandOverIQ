# HandoverIQ: Manual Verification Test Table

This table guides judges and reviewers through evaluating HandoverIQ against all evaluation criteria:

| Step # | Test Objective | Test Action | Expected Result | Verified Status |
|---|---|---|---|---|
| **1** | **Load Demo Project** | Click **"Load demo project (TechFest 2026)"** on Step 1 (Connect) | Ingests 6 synthetic sources (Repo, Tasks CSV, Meeting Notes, Slack Chat, Budget Doc, Ops Credentials). Displays chunk count and redaction breakdown. | **PASS** (Tested) |
| **2** | **Redaction Counts** | Observe top header and source cards | Live counter displays redacted secrets (`API Key / Token`, `Email Address`, `Phone Number`, `Confidential Marker`). Inspecting `src-ops` shows `[REDACTED_API_KEY]`. | **PASS** (Tested) |
| **3** | **Pre-AI Permission Gate** | Switch role in header between **Admin** and **Incoming (Ananya)** on Step 2 | Admin sees all 6 sources (100% of chunks authorized). Incoming member shows higher-clearance chunks withheld before sending to AI. | **PASS** (Tested) |
| **4** | **Reconstruction** | Click **"Run Gemini Reconstruction"** (or **"Use Cached Demo Result"**) | Structured JSON extracted into Decisions (with WHY), Recurring Problems, Risks, Contacts, Next Actions, Timeline, Gaps, and Conflicts. | **PASS** (Tested) |
| **5** | **Quote Verification** | Navigate to Step 3 (Verify) and click any citation (e.g. `src-notes-C1`) | Opens Evidence Drawer: shows 100% code match, full chunk text with exact quoted phrase highlighted in amber/emerald. | **PASS** (Tested) |
| **6** | **Conflict Flagged** | Inspect **"Planted Source Contradictions"** on Step 3 or Step 4 | Flags contradiction between Task Board CSV (claiming Attendee Waitlist is "Done") and Repo/Notes (confirming branch `feature/waitlist` is unfinished). | **PASS** (Tested) |
| **7** | **Gap Flagged** | Inspect **"Knowledge Gaps"** on Step 4 (Review) | System lists missing evidence: "Who owns Annual Payment Gateway Contract Renewal due 15 Nov?". Allows reviewer to submit human answer. | **PASS** (Tested) |
| **8** | **Approval Gate** | Observe Step 4 before and after clicking **"Approve Handover"** | Step 5 is gated as a draft. Clicking "Approve Handover" as Reviewer (Priya Nair) creates Version 1.0 with timestamp and unlocks official sharing. | **PASS** (Tested) |
| **9** | **Hidden Claim for Incoming** | On Step 5 (Handover), switch role to **Incoming (Ananya)** | Lead-only budget claim (Razorpay ₹75,000 security deposit) is masked: *"1 item hidden: requires higher access"* without leaking title or contents. | **PASS** (Tested) |
| **10** | **Acknowledgement** | As **Incoming (Ananya)**, click **"Acknowledge Receipt"** on Step 5 | Records formal incoming sign-off with timestamp. Updates button state to *"✓ Acknowledged by Ananya Rao"*. | **PASS** (Tested) |
| **11** | **Version History & Audit** | Click **"Audit Log"** in top header or check Version History tab | Displays chronological audit trail of all actions with CSV export option. | **PASS** (Tested) |
| **12** | **Export Handover** | Click **"Export Markdown"** and **"Export JSON"** on Step 5 | Downloads complete handover file with citation references and verification statuses. | **PASS** (Tested) |
