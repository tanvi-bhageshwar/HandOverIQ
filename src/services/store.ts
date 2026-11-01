import { AuditLogEntry, Claim, Conflict, GapQuestion, HandoverVersion, ProjectState, Source, UserRole } from '../types';
import { buildDemoSources, DEMO_PROJECT_INFO } from './demoData';
import { CACHED_DEMO_RESULT } from './cachedDemoResult';
import { verifyClaim } from './verify';
import { isClaimHiddenForRole } from './permissions';

const STORAGE_KEY = 'handoveriq_state_v1';

export function getInitialProjectState(): ProjectState {
  const demoSources = buildDemoSources();
  const chunksMap = new Map();
  for (const s of demoSources) {
    for (const c of s.chunks) {
      chunksMap.set(c.chunkId, c);
    }
  }

  // Pre-verify cached claims against chunks
  const verifiedClaims = CACHED_DEMO_RESULT.claims.map((claim) => verifyClaim(claim, chunksMap));

  const initialAudit: AuditLogEntry[] = [
    {
      id: `audit-${Date.now()}-1`,
      timestamp: new Date().toISOString(),
      role: 'admin',
      actor: 'Admin (Club President)',
      action: 'INIT_DEMO_PROJECT',
      details: 'Loaded TechFest 2026 synthetic sources, chunked with stable IDs, applied secrets redaction.',
    },
  ];

  return {
    projectName: DEMO_PROJECT_INFO.name,
    projectDescription: DEMO_PROJECT_INFO.description,
    outgoingPerson: DEMO_PROJECT_INFO.outgoingPerson,
    incomingPerson: DEMO_PROJECT_INFO.incomingPerson,
    leadPerson: DEMO_PROJECT_INFO.leadPerson,
    sources: demoSources,
    claims: verifiedClaims,
    conflicts: CACHED_DEMO_RESULT.conflicts,
    gaps: CACHED_DEMO_RESULT.gaps,
    versions: [],
    currentDraftStatus: 'extracted',
    auditLog: initialAudit,
    lastReconstructedAt: new Date().toISOString(),
  };
}

export function loadProjectState(): ProjectState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialProjectState();
      saveProjectState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.sources || parsed.sources.length === 0) {
      const initial = getInitialProjectState();
      saveProjectState(initial);
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load project state from localStorage:', err);
    return getInitialProjectState();
  }
}

export function saveProjectState(state: ProjectState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save project state to localStorage:', err);
  }
}

export function resetDemoState(): ProjectState {
  localStorage.removeItem(STORAGE_KEY);
  const initial = getInitialProjectState();
  saveProjectState(initial);
  return initial;
}

export function logAudit(
  state: ProjectState,
  role: UserRole,
  actor: string,
  action: string,
  details: string
): ProjectState {
  const newEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    role,
    actor,
    action,
    details,
  };

  const updatedState = {
    ...state,
    auditLog: [newEntry, ...state.auditLog],
  };

  saveProjectState(updatedState);
  return updatedState;
}

/**
 * Generate a complete Markdown export of the handover
 */
export function generateMarkdownExport(state: ProjectState, activeRole: UserRole): string {
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const latestVersion = state.versions.length > 0 ? state.versions[state.versions.length - 1] : null;

  let md = `# HandoverIQ Continuation Plan: ${state.projectName}\n\n`;
  md += `> **Status:** ${latestVersion ? `Approved Version v${latestVersion.versionNumber} (Approved by ${latestVersion.approvedBy})` : 'AI Draft (Unapproved)'}\n`;
  md += `> **Export Date:** ${dateStr}\n`;
  md += `> **Outgoing Member:** ${state.outgoingPerson}\n`;
  md += `> **Incoming Member:** ${state.incomingPerson}\n`;
  md += `> **Lead Reviewer:** ${state.leadPerson}\n\n`;

  md += `## 1. Project Overview\n${state.projectDescription}\n\n`;

  md += `## 2. Executive Continuation Plan (Verified Knowledge Base)\n\n`;

  const visibleClaims = state.claims.filter((c) => !isClaimHiddenForRole(c, activeRole));
  const hiddenCount = state.claims.length - visibleClaims.length;

  if (hiddenCount > 0) {
    md += `*Note: ${hiddenCount} item(s) are omitted from this export because they require higher security clearance.*\n\n`;
  }

  // Group by category
  const categories: Array<{ key: Claim['category']; title: string }> = [
    { key: 'decision', title: 'Architectural Decisions & Rationale' },
    { key: 'recurring_problem', title: 'Recurring Problems & Known Fixes' },
    { key: 'risk', title: 'Active Risks & Blockers' },
    { key: 'next_action', title: 'Next Immediate Actions' },
    { key: 'contact', title: 'Project Contacts (Who to Ask For What)' },
    { key: 'timeline', title: 'Timeline & Milestone Status' },
  ];

  for (const cat of categories) {
    const claimsInCat = visibleClaims.filter((c) => c.category === cat.key);
    if (claimsInCat.length === 0) continue;

    md += `### ${cat.title}\n\n`;
    for (const c of claimsInCat) {
      md += `#### ${c.title}\n`;
      md += `**Verification Status:** [${c.overallStatus.toUpperCase()}] | **Review Status:** [${c.humanReviewStatus.toUpperCase()}]\n\n`;
      md += `${c.description}\n\n`;

      if (c.rationale) {
        md += `**Rationale / The WHY:** ${c.rationale}\n\n`;
      }

      if (c.extra) {
        if (c.extra.knownFix) md += `**Known Fix Procedure:** ${c.extra.knownFix}\n\n`;
        if (c.extra.contactName) md += `**Contact:** ${c.extra.contactName} (${c.extra.contactHandle || ''}) - ${c.extra.contactDomain || ''}\n\n`;
        if (c.extra.dueDate) md += `**Due Date:** ${c.extra.dueDate} | **Owner:** ${c.extra.owner || 'Unassigned'}\n\n`;
      }

      if (c.citations && c.citations.length > 0) {
        md += `*Evidence Citations:*\n`;
        for (const cit of c.citations) {
          md += `- Source: \`${cit.sourceId}\` (${cit.chunkId}) - "${cit.quote}" [Status: ${cit.validationStatus}]\n`;
        }
        md += `\n`;
      }
    }
  }

  // Conflicts
  md += `## 3. Discovered Conflicts & Discrepancies\n\n`;
  if (state.conflicts.length === 0) {
    md += `*No source contradictions discovered.*\n\n`;
  } else {
    for (const conf of state.conflicts) {
      md += `### Conflict: ${conf.topic}\n`;
      md += `- **Perspective A:** ${conf.claimA.statement}\n  *Citation: \`${conf.claimA.citation.chunkId}\` ("${conf.claimA.citation.quote}")*\n`;
      md += `- **Perspective B:** ${conf.claimB.statement}\n  *Citation: \`${conf.claimB.citation.chunkId}\` ("${conf.claimB.citation.quote}")*\n`;
      md += `- **Resolution:** ${conf.resolved ? `Resolved by ${conf.resolvedBy || 'Lead'}: ${conf.resolutionNote}` : 'UNRESOLVED (Pending review)'}\n\n`;
    }
  }

  // Gaps
  md += `## 4. Knowledge Gaps (Missing Evidence)\n\n`;
  if (state.gaps.length === 0) {
    md += `*No information gaps identified.*\n\n`;
  } else {
    for (const g of state.gaps) {
      md += `### ${g.question} [Urgency: ${g.urgency.toUpperCase()}]\n`;
      md += `**Context:** ${g.context}\n`;
      if (g.status === 'answered') {
        md += `**Human-Provided Answer (by ${g.answeredBy || 'Reviewer'}):** ${g.answer}\n\n`;
      } else {
        md += `**Status:** UNANSWERED GAP\n\n`;
      }
    }
  }

  // Audit history
  md += `## 5. Audit Log & Approval Chain\n\n`;
  for (const a of state.auditLog.slice(0, 10)) {
    md += `- \`${a.timestamp}\` [${a.role.toUpperCase()}] **${a.actor}**: ${a.action} - ${a.details}\n`;
  }

  return md;
}
