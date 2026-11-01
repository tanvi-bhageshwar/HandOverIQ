import { Chunk, Claim, Conflict, GapQuestion } from '../types';
import { verifyClaim } from './verify';

export interface ReconstructionResponse {
  success: boolean;
  claims: Claim[];
  conflicts: Conflict[];
  gaps: GapQuestion[];
  modelUsed?: string;
  error?: string;
  isApiKeyMissing?: boolean;
}

export async function reconstructProjectState(
  chunks: Chunk[],
  projectName: string,
  chunksMap: Map<string, Chunk>
): Promise<ReconstructionResponse> {
  let attempt = 0;
  const maxAttempts = 2;
  let lastError = '';
  let isApiKeyMissing = false;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const response = await fetch('/api/gemini/reconstruct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunks, projectName }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        if (errJson.isApiKeyMissing) {
          isApiKeyMissing = true;
        }
        throw new Error(errJson.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      if (!result.data) {
        throw new Error('Invalid JSON payload returned from reconstruction endpoint.');
      }

      const raw = result.data;

      // Map raw extracted items into typed Claims
      const claims: Claim[] = [];
      let claimIdCounter = 1;

      // 1. Decisions
      if (Array.isArray(raw.decisions)) {
        for (const item of raw.decisions) {
          claims.push({
            id: `claim-${claimIdCounter++}`,
            category: 'decision',
            title: item.title,
            description: item.description,
            rationale: item.whyRationale,
            accessLevel: 'team',
            overallStatus: 'unverified',
            humanReviewStatus: 'pending',
            priority: 'high',
            citations: Array.isArray(item.citations) ? item.citations : [],
          });
        }
      }

      // 2. Recurring problems
      if (Array.isArray(raw.recurringProblems)) {
        for (const item of raw.recurringProblems) {
          claims.push({
            id: `claim-${claimIdCounter++}`,
            category: 'recurring_problem',
            title: item.title,
            description: item.description,
            accessLevel: 'team',
            overallStatus: 'unverified',
            humanReviewStatus: 'pending',
            priority: 'high',
            extra: {
              symptom: item.symptom,
              rootCause: item.rootCause,
              knownFix: item.knownFix,
            },
            citations: Array.isArray(item.citations) ? item.citations : [],
          });
        }
      }

      // 3. Risks & blockers
      if (Array.isArray(raw.risksAndBlockers)) {
        for (const item of raw.risksAndBlockers) {
          claims.push({
            id: `claim-${claimIdCounter++}`,
            category: 'risk',
            title: item.title,
            description: item.description,
            accessLevel: 'team',
            overallStatus: 'unverified',
            humanReviewStatus: 'pending',
            priority: item.priority?.toLowerCase() === 'critical' ? 'critical' : 'high',
            extra: {
              owner: item.owner,
            },
            citations: Array.isArray(item.citations) ? item.citations : [],
          });
        }
      }

      // 4. Contacts
      if (Array.isArray(raw.contacts)) {
        for (const item of raw.contacts) {
          claims.push({
            id: `claim-${claimIdCounter++}`,
            category: 'contact',
            title: `Contact: ${item.contactName}`,
            description: `Who to ask for: ${item.contactDomain}`,
            accessLevel: 'team',
            overallStatus: 'unverified',
            humanReviewStatus: 'pending',
            priority: 'medium',
            extra: {
              contactName: item.contactName,
              contactDomain: item.contactDomain,
              contactHandle: item.contactHandle,
            },
            citations: Array.isArray(item.citations) ? item.citations : [],
          });
        }
      }

      // 5. Next Actions
      if (Array.isArray(raw.nextActions)) {
        for (const item of raw.nextActions) {
          claims.push({
            id: `claim-${claimIdCounter++}`,
            category: 'next_action',
            title: item.title,
            description: item.description,
            accessLevel: 'team',
            overallStatus: 'unverified',
            humanReviewStatus: 'pending',
            priority: item.priority?.toLowerCase() === 'critical' ? 'critical' : 'medium',
            extra: {
              owner: item.owner,
              dueDate: item.dueDate,
            },
            citations: Array.isArray(item.citations) ? item.citations : [],
          });
        }
      }

      // 6. Timeline
      if (Array.isArray(raw.timeline)) {
        for (const item of raw.timeline) {
          claims.push({
            id: `claim-${claimIdCounter++}`,
            category: 'timeline',
            title: item.title,
            description: item.description,
            accessLevel: 'team',
            overallStatus: item.isConfirmed === false ? 'partial' : 'unverified',
            humanReviewStatus: 'pending',
            priority: 'low',
            extra: {
              milestoneDate: item.milestoneDate,
            },
            citations: Array.isArray(item.citations) ? item.citations : [],
          });
        }
      }

      // Conflicts
      const conflicts: Conflict[] = [];
      if (Array.isArray(raw.conflicts)) {
        let confCounter = 1;
        for (const c of raw.conflicts) {
          conflicts.push({
            id: `conflict-${confCounter++}`,
            topic: c.topic,
            claimA: {
              statement: c.claimA.statement,
              citation: {
                sourceId: c.claimA.sourceId,
                chunkId: c.claimA.chunkId,
                quote: c.claimA.quote,
                validationStatus: 'verified',
                matchScore: 1.0,
              },
            },
            claimB: {
              statement: c.claimB.statement,
              citation: {
                sourceId: c.claimB.sourceId,
                chunkId: c.claimB.chunkId,
                quote: c.claimB.quote,
                validationStatus: 'verified',
                matchScore: 1.0,
              },
            },
            resolved: false,
          });
        }
      }

      // Gaps
      const gaps: GapQuestion[] = [];
      if (Array.isArray(raw.gaps)) {
        let gapCounter = 1;
        for (const g of raw.gaps) {
          gaps.push({
            id: `gap-${gapCounter++}`,
            question: g.question,
            context: g.context,
            urgency: g.urgency?.toLowerCase() === 'critical' ? 'critical' : 'high',
            status: 'open',
          });
        }
      }

      // Run DETERMINISTIC CODE-BASED VERIFICATION on all claims!
      const verifiedClaims = claims.map((claim) => verifyClaim(claim, chunksMap));

      return {
        success: true,
        claims: verifiedClaims,
        conflicts,
        gaps,
        modelUsed: result.modelUsed,
      };
    } catch (err: any) {
      lastError = err.message || 'Network error communicating with reconstruction service.';
      if (attempt < maxAttempts) {
        console.warn(`Reconstruction attempt ${attempt} failed, retrying once...`);
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
  }

  return {
    success: false,
    claims: [],
    conflicts: [],
    gaps: [],
    error: lastError,
    isApiKeyMissing,
  };
}
