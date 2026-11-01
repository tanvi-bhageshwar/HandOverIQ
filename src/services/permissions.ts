import { AccessLevel, UserRole, Claim, Chunk } from '../types';

export const ROLE_HIERARCHY: Record<UserRole, AccessLevel[]> = {
  admin: ['public', 'team', 'lead-only', 'admin-only'],
  lead: ['public', 'team', 'lead-only'],
  outgoing: ['public', 'team', 'lead-only'],
  incoming: ['public', 'team'],
};

export const ROLE_LABELS: Record<UserRole, { title: string; subtitle: string; clearanceLabel: string; badgeColor: string }> = {
  admin: {
    title: 'Admin (Club President / Sec)',
    subtitle: 'Full access to all sources, operations notes, and audit log',
    clearanceLabel: 'Admin-Only Clearance (Level 4)',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  lead: {
    title: 'Team Lead / Reviewer (Priya Nair)',
    subtitle: 'Authorised reviewer: reviews drafts, resolves gaps, approves handovers',
    clearanceLabel: 'Lead-Only Clearance (Level 3)',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  outgoing: {
    title: 'Outgoing Member (Rohan Mehta)',
    subtitle: 'Backend & Payments author: adds notes, clarifies gaps before departure',
    clearanceLabel: 'Team + Lead Clearance (Level 3)',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  incoming: {
    title: 'Incoming Member (Ananya Rao)',
    subtitle: 'Receiving handover: sees only approved continuation plan at team clearance',
    clearanceLabel: 'Team Clearance (Level 2)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
};

/**
 * Check if a role has clearance for a given access level
 */
export function hasClearance(role: UserRole, accessLevel: AccessLevel, incomingClearanceConfig: AccessLevel[] = ['public', 'team']): boolean {
  if (role === 'incoming') {
    return incomingClearanceConfig.includes(accessLevel);
  }
  const allowed = ROLE_HIERARCHY[role] || ['public'];
  return allowed.includes(accessLevel);
}

/**
 * Filter chunks BEFORE sending to Gemini or before rendering
 */
export function filterChunksForRole(
  chunks: Chunk[],
  role: UserRole,
  incomingClearanceConfig: AccessLevel[] = ['public', 'team']
): Chunk[] {
  return chunks.filter((chunk) => hasClearance(role, chunk.accessLevel, incomingClearanceConfig));
}

/**
 * Evaluate if a claim contains citations or sources requiring higher access
 */
export function isClaimHiddenForRole(
  claim: Claim,
  role: UserRole,
  incomingClearanceConfig: AccessLevel[] = ['public', 'team']
): boolean {
  // Check the claim's designated access level
  if (!hasClearance(role, claim.accessLevel, incomingClearanceConfig)) {
    return true;
  }

  // Also check if any cited source is above role clearance
  for (const citation of claim.citations) {
    if (citation.sourceAccessLevel && !hasClearance(role, citation.sourceAccessLevel, incomingClearanceConfig)) {
      return true;
    }
  }

  return false;
}
