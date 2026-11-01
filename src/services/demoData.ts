import { Source } from '../types';
import { chunkContent } from './redact';

export const DEMO_PROJECT_INFO = {
  name: 'TechFest 2026 Registration Platform',
  description: 'Mission-critical student festival ticketing, payments, and team onboarding portal.',
  outgoingPerson: 'Rohan Mehta (Backend & Payments Lead)',
  incomingPerson: 'Ananya Rao (Incoming Platform Engineer)',
  leadPerson: 'Priya Nair (Technical Lead & Reviewer)',
};

export const RAW_DEMO_SOURCES: Array<{
  id: string;
  name: string;
  type: 'repo' | 'tasks' | 'notes' | 'chat' | 'doc';
  accessLevel: 'public' | 'team' | 'lead-only' | 'admin-only';
  content: string;
}> = [
  {
    id: 'src-repo',
    name: 'techfest-backend (Repo README & Git Log)',
    type: 'repo',
    accessLevel: 'team',
    content: `# TechFest 2026 Registration Engine
Service handling attendee registration, payment callbacks, ticket generation, and team rosters.

## Core Architecture
- Runtime: Node.js 22 LTS + Express TypeScript
- Database: PostgreSQL with Drizzle ORM
- Queue: BullMQ with Redis 7 for webhook retries
- Payment Gateway: Razorpay Standard Checkout & Webhooks

## Active Branches & Pending Work
- \`main\`: Production-ready release v1.1.0 with Razorpay integration.
- \`feature/waitlist\`: UNFINISHED branch by Rohan Mehta. PR #42 remains in draft status.
  * Waitlist queue worker is 60% implemented but database migration 0008_waitlist_schema.sql has not been run.
  * Blocked on ticket surge capacity limits pending dean approval.

## Known Production Issues & Bug Tracker
- Issue #84 (High): Webhook retry loop bug. When Razorpay sends duplicate payment.captured events within 200ms, the idempotency key lock releases prematurely, causing double email dispatch. Fix in progress by Rohan.
- Issue #89: Rate limiter on /api/verify-student endpoint trips during peak campus Wi-Fi bursts. Redis token bucket limit should be raised from 100 to 250 requests per minute.
- Issue #91: PDF ticket rendering memory leak when batch-exporting >500 tickets. Need to switch from html2canvas to server-side Puppeteer stream.

## Recent Commit Log
- commit a8f921d (2 days ago): "refactor(payment): harden razorpay signature check with timingSafeEqual"
- commit 54c330e (4 days ago): "wip(waitlist): draft waitlist queue logic - NOT READY FOR PRODUCTION"
- commit 19b7a42 (1 week ago): "fix(auth): correct student roll number regex pattern for 2026 batch"
- commit 98a12e3 (2 weeks ago): "feat(webhook): add initial BullMQ retry backoff with exponential delay"`,
  },
  {
    id: 'src-tasks',
    name: 'Sprint-Board-Export-Oct2026.csv (Task Board)',
    type: 'tasks',
    accessLevel: 'team',
    content: `TaskId,Title,Assignee,Status,Priority,DueDate,Dependencies,Notes
TF-101,Razorpay Checkout Integration,Rohan Mehta,Completed,Critical,2026-10-15,None,Signature validation active in production
TF-102,Database Schema v1.1 Migration,Rohan Mehta,Completed,High,2026-10-18,None,Postgres migration script verified
TF-103,Attendee Waitlist Management,Rohan Mehta,Completed,Medium,2026-10-24,TF-102,Marked complete on sprint close sheet
TF-104,Fix Monday Webhook Timeout Bug,Rohan Mehta,In Progress,High,2026-11-05,TF-101,Investigating Redis lease lock failure
TF-105,Student Verification Rate Limit Boost,Ananya Rao,Planned,Medium,2026-11-10,None,Raise token bucket to 250 req/min
TF-106,Annual Payment Gateway Contract Renewal,Unassigned,To Do,Critical,2026-11-15,None,Requires dean signature and GST invoice
TF-107,DNS Record Handover for techfest.edu,Meera Joshi,In Progress,High,2026-11-08,None,Cloudflare nameserver delegation
TF-108,Sponsorship Portal API Integration,Kabir Sen,Planned,Low,2026-11-20,TF-101,REST webhook for tier-1 partner passes`,
  },
  {
    id: 'src-notes',
    name: 'Core-Architecture-Decisions.md (Meeting Notes)',
    type: 'notes',
    accessLevel: 'team',
    content: `# TechFest Architecture Decision Records & Meeting Minutes

## Meeting 1 (2026-09-12): Payment Gateway Selection
- Attendees: Priya Nair (Lead), Rohan Mehta (Backend), Kabir Sen (Sponsorship)
- Decision: Select Razorpay over Stripe India.
- WHY: Razorpay provides native UPI Autopay, lower domestic transaction fees of 2.0% (vs Stripe's 3.2%), and direct integration with Indian student bank accounts (SBI, HDFC, ICICI netbanking).
- Trade-off accepted: Razorpay dashboard reconciliation takes 48 hours for disputed UPI chargebacks.

## Meeting 2 (2026-10-04): Waitlist Feature Scope Reduction
- Attendees: Priya Nair, Rohan Mehta
- Decision: Postpone attendee waitlist feature to v1.2 release after core registrations open.
- WHY: Waitlist adds complexity to database transaction locks and ticket inventory allocations. We must prioritize rock-solid payment processing first. Branch feature/waitlist will remain paused.
- Note: Rohan was instructed NOT to merge feature/waitlist to main.

## Meeting 3 (2026-10-22): Infrastructure & Redis Caching
- Attendees: Priya Nair, Rohan Mehta, Meera Joshi
- Decision: Redis instance will run on dedicated cache tier with persistent AOF logging enabled.
- Action: Document recurring Monday maintenance cycle for incoming engineers.`,
  },
  {
    id: 'src-chat',
    name: '#dev-backend-slack-export.txt (Engineering Chat)',
    type: 'chat',
    accessLevel: 'team',
    content: `[2026-10-26 10:14:02] Rohan: Heads up team: every Monday morning after our hosting provider executes the 03:00 AM UTC Redis maintenance, the webhook worker times out.
[2026-10-26 10:16:45] Priya: Why does that happen again?
[2026-10-26 10:18:10] Rohan: The Redis connection pool drops stale socket leases without triggering an onError callback.
[2026-10-26 10:20:00] Rohan: The known fix is: 1) SSH into worker node, 2) execute "docker restart techfest-worker-redis", and 3) run "npm run queue:flush-stale-leases". Takes 45 seconds to recover.
[2026-10-27 14:05:22] Rohan: For anyone needing project contacts when I depart:
[2026-10-27 14:06:10] Rohan: Ask Kabir Sen (#sponsorships, ext 442) for corporate pass quotas and sponsor coupon codes.
[2026-10-27 14:07:30] Rohan: Ask Meera Joshi (#infra-ops, Slack: @meeraj) for domain DNS records, Cloudflare SSL certs, and campus server room access.
[2026-10-28 09:30:15] Kabir: Hey folks, someone in the student council mentioned fest kickoff date might be moved up to Jan 15 from Jan 25?
[2026-10-28 09:34:00] Priya: That is unconfirmed chatter from cultural committee. DO NOT change any system release schedules until council issues official circular.`,
  },
  {
    id: 'src-budget',
    name: 'Vendor-Agreements-and-Budget.md (Financial Doc)',
    type: 'doc',
    accessLevel: 'lead-only',
    content: `# CONFIDENTIAL: TechFest 2026 Vendor Commercials & Financials
Classification: LEAD-ONLY ACCESS. DO NOT DISTRIBUTE TO GENERAL TEAM.

## Payment Gateway Commercial Terms
- Razorpay Enterprise Security Deposit: ₹75,000 paid via university treasury account #40881923.
- Transaction Discount Rate (TDR): 1.85% + GST for UPI transactions; 2.2% for credit cards.
- Server Budget Ceiling: Monthly cloud spend is hard-capped at ₹32,000 across Supabase and Render.
- Breach Penalty: Late annual contract renewal after 2026-11-15 triggers ₹5,000 weekly reactivation fee.

## Escalation Contacts
- Vendor Account Manager: Rajesh Verma (Razorpay Institutional Lead, email: [REDACTED_EMAIL])
- Faculty Treasurer: Prof. S. Krishnamurthy (ext 102)` ,
  },
  {
    id: 'src-ops',
    name: 'Internal-Ops-Credentials.txt (Security Runbook)',
    type: 'doc',
    accessLevel: 'admin-only',
    content: `# RESTRICTED ADMIN RUNBOOK & CREDENTIAL VAULT
Classification: ADMIN-ONLY CLEARANCE. PROHIBITED FROM UNENCRYPTED REPOSITORIES.

## Staging & Production API Credentials
[CONFIDENTIAL] Staging Environment Sandbox Secrets:
- Razorpay Staging Key ID: rzp_test_FAKEKEY1234567890
- Razorpay Webhook Secret: sec_test_9876543210fedcba_FAKE
- Google Maps Platform Geocoding API: AIzaSyFakeKey_ForTesting1234567890abcdef
- GitHub Deployment Token: ghp_FakeGitHubPersonalToken9876543210abc
- Club Emergency Hotline: +91 98765 43210
- Admin Master Email: sysadmin-techfest2026@club.university.edu

## Deployment Checklist
1. Never commit .env files containing rzp_test or AIza keys.
2. Ensure automated secrets scanner passes before pull request approval.
3. Rotating production webhook secrets requires 24hr notice to payment gateway ops.`,
  },
];

export function buildDemoSources(): Source[] {
  return RAW_DEMO_SOURCES.map((raw) => {
    const chunks = chunkContent(raw.id, raw.name, raw.content, raw.accessLevel, 10);
    // Combine redactions across chunks
    const redactionStatsMap = new Map<string, number>();
    for (const c of chunks) {
      if (c.redactionsCount > 0) {
        // approximate tally
        redactionStatsMap.set('API Key / Token', (redactionStatsMap.get('API Key / Token') || 0) + (c.text.includes('[REDACTED_API_KEY]') ? 1 : 0));
        redactionStatsMap.set('Email Address', (redactionStatsMap.get('Email Address') || 0) + (c.text.includes('[REDACTED_EMAIL]') ? 1 : 0));
        redactionStatsMap.set('Phone Number', (redactionStatsMap.get('Phone Number') || 0) + (c.text.includes('[REDACTED_PHONE]') ? 1 : 0));
        redactionStatsMap.set('Confidential Marker', (redactionStatsMap.get('Confidential Marker') || 0) + (c.text.includes('[REDACTED_CONFIDENTIAL_ITEM]') ? 1 : 0));
      }
    }

    const redactions = Array.from(redactionStatsMap.entries()).map(([type, count]) => ({
      type: type as any,
      count,
    }));

    return {
      id: raw.id,
      name: raw.name,
      type: raw.type,
      accessLevel: raw.accessLevel,
      content: raw.content,
      chunks,
      redactions,
      createdAt: '2026-10-31T20:00:00Z',
    };
  });
}
