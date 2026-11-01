import { Claim, Conflict, GapQuestion } from '../types';

export const CACHED_DEMO_RESULT: {
  projectName: string;
  projectDescription: string;
  claims: Claim[];
  conflicts: Conflict[];
  gaps: GapQuestion[];
} = {
  projectName: 'TechFest 2026 Registration Platform',
  projectDescription:
    'Mission-critical student festival ticketing, payments, and team onboarding portal with Razorpay payment processing and Redis queue workers.',
  claims: [
    {
      id: 'claim-1',
      category: 'decision',
      title: 'Architectural Choice: Razorpay Chosen Over Stripe India',
      description:
        'Selected Razorpay as primary payment gateway rather than Stripe India for attendee registration checkout.',
      rationale:
        'Razorpay provides native UPI Autopay, lower domestic transaction fees of 2.0% (vs Stripe’s 3.2%), and direct integration with Indian student bank accounts (SBI, HDFC, ICICI netbanking).',
      accessLevel: 'team',
      overallStatus: 'verified',
      humanReviewStatus: 'approved',
      priority: 'critical',
      citations: [
        {
          sourceId: 'src-notes',
          chunkId: 'src-notes-C1',
          quote:
            'Razorpay provides native UPI Autopay, lower domestic transaction fees of 2.0% (vs Stripe\'s 3.2%), and direct integration with Indian student bank accounts',
          validationStatus: 'verified',
          matchScore: 1.0,
          validationNote: 'Exact verbatim quote confirmed in meeting notes chunk src-notes-C1',
        },
      ],
    },
    {
      id: 'claim-2',
      category: 'risk',
      title: 'Issue #84: Duplicate Webhook Idempotency Lock Failure',
      description:
        'When Razorpay fires duplicate payment.captured events within 200ms, the idempotency lock releases prematurely, causing double email dispatch.',
      accessLevel: 'team',
      overallStatus: 'verified',
      humanReviewStatus: 'pending',
      priority: 'high',
      extra: {
        owner: 'Rohan Mehta',
        status: 'In Progress',
      },
      citations: [
        {
          sourceId: 'src-repo',
          chunkId: 'src-repo-C2',
          quote:
            'When Razorpay sends duplicate payment.captured events within 200ms, the idempotency key lock releases prematurely, causing double email dispatch.',
          validationStatus: 'verified',
          matchScore: 1.0,
          validationNote: 'Exact verbatim quote confirmed in repository issue tracker src-repo-C2',
        },
      ],
    },
    {
      id: 'claim-3',
      category: 'recurring_problem',
      title: 'Monday Morning Redis Socket Lease Timeout & 45-Second Recovery',
      description:
        'Every Monday morning after hosting provider 03:00 AM UTC maintenance, Redis connection pool drops stale socket leases without triggering onError callback.',
      rationale: 'Hosting maintenance silently closes idle TCP connections.',
      accessLevel: 'team',
      overallStatus: 'verified',
      humanReviewStatus: 'approved',
      priority: 'high',
      extra: {
        symptom: 'Webhook worker times out every Monday morning after 03:00 AM UTC cache reset.',
        knownFix:
          '1) SSH into worker node, 2) execute "docker restart techfest-worker-redis", and 3) run "npm run queue:flush-stale-leases". Takes 45 seconds to recover.',
      },
      citations: [
        {
          sourceId: 'src-chat',
          chunkId: 'src-chat-C1',
          quote:
            'The known fix is: 1) SSH into worker node, 2) execute "docker restart techfest-worker-redis", and 3) run "npm run queue:flush-stale-leases". Takes 45 seconds to recover.',
          validationStatus: 'verified',
          matchScore: 1.0,
          validationNote: 'Exact verbatim quote confirmed in team engineering chat src-chat-C1',
        },
      ],
    },
    {
      id: 'claim-4',
      category: 'contact',
      title: 'Key Project Contact: Kabir Sen for Corporate Passes & Sponsorships',
      description:
        'Kabir Sen manages corporate pass allocations, tier-1 partner passes, and sponsor coupon codes.',
      accessLevel: 'team',
      overallStatus: 'verified',
      humanReviewStatus: 'approved',
      priority: 'medium',
      extra: {
        contactName: 'Kabir Sen',
        contactDomain: 'Corporate sponsorships, sponsor coupon codes, partner pass quotas',
        contactHandle: '#sponsorships, ext 442',
      },
      citations: [
        {
          sourceId: 'src-chat',
          chunkId: 'src-chat-C1',
          quote: 'Ask Kabir Sen (#sponsorships, ext 442) for corporate pass quotas and sponsor coupon codes.',
          validationStatus: 'verified',
          matchScore: 1.0,
          validationNote: 'Exact verbatim quote confirmed in chat src-chat-C1',
        },
      ],
    },
    {
      id: 'claim-5',
      category: 'contact',
      title: 'Key Project Contact: Meera Joshi for DNS, Cloudflare & Server Room',
      description:
        'Meera Joshi controls domain DNS delegation, Cloudflare SSL configurations, and campus physical server room access.',
      accessLevel: 'team',
      overallStatus: 'verified',
      humanReviewStatus: 'approved',
      priority: 'medium',
      extra: {
        contactName: 'Meera Joshi',
        contactDomain: 'Domain DNS records, Cloudflare SSL certs, campus server room physical access',
        contactHandle: '#infra-ops, Slack: @meeraj',
      },
      citations: [
        {
          sourceId: 'src-chat',
          chunkId: 'src-chat-C1',
          quote: 'Ask Meera Joshi (#infra-ops, Slack: @meeraj) for domain DNS records, Cloudflare SSL certs, and campus server room access.',
          validationStatus: 'verified',
          matchScore: 1.0,
          validationNote: 'Exact verbatim quote confirmed in chat src-chat-C1',
        },
      ],
    },
    {
      id: 'claim-6',
      category: 'timeline',
      title: 'Fest Kickoff Date Rescheduling Rumour (Unconfirmed)',
      description:
        'Casual discussion in chat suggested TechFest kickoff date might move from Jan 25 to Jan 15.',
      rationale:
        'Lead Priya Nair explicitly instructed NOT to modify release schedule as this is unconfirmed chatter from cultural committee.',
      accessLevel: 'team',
      overallStatus: 'partial',
      humanReviewStatus: 'pending',
      priority: 'low',
      citations: [
        {
          sourceId: 'src-chat',
          chunkId: 'src-chat-C1',
          quote: 'fest kickoff date might be moved up to Jan 15 from Jan 25?',
          validationStatus: 'partial',
          matchScore: 0.85,
          validationNote:
            'Partial/unconfirmed claim: mentioned casually in chat by Kabir, but Priya stated it is unconfirmed chatter from cultural committee without official council circular.',
        },
      ],
    },
    {
      id: 'claim-7',
      category: 'decision',
      title: 'Razorpay Commercial Deposit & Cloud Cost Limits (Financials)',
      description:
        'University paid ₹75,000 security deposit for Razorpay enterprise agreement; monthly cloud infrastructure spend hard-capped at ₹32,000.',
      rationale: 'University treasury guidelines require deposit to secure lower 1.85% TDR rate.',
      accessLevel: 'lead-only',
      overallStatus: 'verified',
      humanReviewStatus: 'approved',
      priority: 'high',
      citations: [
        {
          sourceId: 'src-budget',
          chunkId: 'src-budget-C1',
          quote:
            'Razorpay Enterprise Security Deposit: ₹75,000 paid via university treasury account #40881923.',
          validationStatus: 'verified',
          matchScore: 1.0,
          validationNote: 'Exact verbatim quote confirmed in confidential vendor doc src-budget-C1',
        },
      ],
    },
    {
      id: 'claim-8',
      category: 'next_action',
      title: 'Student Verification Rate Limit Boost to 250 req/min',
      description:
        'Raise Redis token bucket rate limit on /api/verify-student from 100 to 250 requests/min to accommodate peak campus Wi-Fi bursts.',
      accessLevel: 'team',
      overallStatus: 'verified',
      humanReviewStatus: 'approved',
      priority: 'medium',
      extra: {
        owner: 'Ananya Rao',
        dueDate: '2026-11-10',
      },
      citations: [
        {
          sourceId: 'src-repo',
          chunkId: 'src-repo-C2',
          quote:
            'Redis token bucket limit should be raised from 100 to 250 requests per minute.',
          validationStatus: 'verified',
          matchScore: 1.0,
          validationNote: 'Exact verbatim quote confirmed in repo issues src-repo-C2',
        },
      ],
    },
  ],
  conflicts: [
    {
      id: 'conflict-1',
      topic: 'Attendee Waitlist Implementation Status (Done vs Incomplete)',
      claimA: {
        statement:
          'Sprint Task Board CSV marks Task TF-103 "Attendee Waitlist Management" as Completed by Rohan Mehta on 2026-10-24.',
        citation: {
          sourceId: 'src-tasks',
          chunkId: 'src-tasks-C1',
          quote: 'TF-103,Attendee Waitlist Management,Rohan Mehta,Completed,Medium,2026-10-24,TF-102,Marked complete on sprint close sheet',
          validationStatus: 'verified',
          matchScore: 1.0,
          validationNote: 'Found on sprint CSV export',
        },
      },
      claimB: {
        statement:
          'Repository README and Meeting Notes #2 confirm branch "feature/waitlist" is UNFINISHED, PR #42 is in draft, migration 0008 was never run, and Priya ordered it postponed to v1.2.',
        citation: {
          sourceId: 'src-repo',
          chunkId: 'src-repo-C1',
          quote:
            'feature/waitlist: UNFINISHED branch by Rohan Mehta. PR #42 remains in draft status. Waitlist queue worker is 60% implemented but database migration 0008_waitlist_schema.sql has not been run.',
          validationStatus: 'verified',
          matchScore: 1.0,
          validationNote: 'Found in Git branch status documentation',
        },
      },
      resolved: false,
    },
  ],
  gaps: [
    {
      id: 'gap-1',
      question: 'Who owns the Annual Payment Gateway Contract Renewal due 15 November 2026?',
      context:
        'Task TF-106 shows status "To Do" with owner "Unassigned". Vendor doc specifies that missing the Nov 15 deadline incurs a ₹5,000/week reactivation penalty and requires Dean signature + GST invoice.',
      urgency: 'critical',
      status: 'open',
    },
    {
      id: 'gap-2',
      question: 'Where is the staging server SSH private key stored for techfest-worker-redis?',
      context:
        'The Monday recovery procedure states "SSH into worker node", but neither the repository README nor the internal ops runbook specifies where the worker SSH key is archived.',
      urgency: 'high',
      status: 'open',
    },
  ],
};
