import { Chunk, Citation, Claim, ClaimStatus } from '../types';

/**
 * Normalise text for robust quote matching:
 * lowercase, collapsible whitespace, strip smart quotes and non-essential punctuation.
 */
export function normaliseText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[“”"']/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface VerificationResult {
  status: ClaimStatus;
  matchScore: number;
  foundInChunk: boolean;
  highlightRange?: { start: number; length: number };
  note: string;
}

/**
 * Verifies a single quote against a specific chunk text in code.
 */
export function verifyQuoteAgainstChunk(quote: string, chunkText: string): VerificationResult {
  if (!quote || quote.trim().length === 0) {
    return {
      status: 'unverified',
      matchScore: 0,
      foundInChunk: false,
      note: 'No citation quote provided by model',
    };
  }

  const cleanQuote = quote.trim();
  const normChunk = normaliseText(chunkText);
  const normQuote = normaliseText(cleanQuote);

  // 1. Direct exact or normalised substring match
  const rawIdx = chunkText.toLowerCase().indexOf(cleanQuote.toLowerCase());
  if (rawIdx !== -1) {
    return {
      status: 'verified',
      matchScore: 1.0,
      foundInChunk: true,
      highlightRange: { start: rawIdx, length: cleanQuote.length },
      note: 'Exact verbatim quote confirmed in cited chunk (100% match)',
    };
  }

  const normIdx = normChunk.indexOf(normQuote);
  if (normIdx !== -1) {
    return {
      status: 'verified',
      matchScore: 0.98,
      foundInChunk: true,
      note: 'Normalised text quote verified in cited chunk (>98% match)',
    };
  }

  // 2. Token overlap / partial match
  const quoteTokens = normQuote.split(/\s+/).filter((t) => t.length > 2);
  if (quoteTokens.length === 0) {
    return {
      status: 'unverified',
      matchScore: 0,
      foundInChunk: false,
      note: 'Quote too short or contains no searchable terms',
    };
  }

  let matchedTokens = 0;
  for (const token of quoteTokens) {
    if (normChunk.includes(token)) {
      matchedTokens++;
    }
  }

  const tokenRatio = matchedTokens / quoteTokens.length;

  if (tokenRatio >= 0.75) {
    return {
      status: 'verified',
      matchScore: Math.round(tokenRatio * 100) / 100,
      foundInChunk: true,
      note: `Strong keyword match in chunk (${Math.round(tokenRatio * 100)}% terms confirmed)`,
    };
  } else if (tokenRatio >= 0.45) {
    return {
      status: 'partial',
      matchScore: Math.round(tokenRatio * 100) / 100,
      foundInChunk: true,
      note: `Partial match: only ${Math.round(tokenRatio * 100)}% of quoted text found in chunk`,
    };
  }

  return {
    status: 'unverified',
    matchScore: Math.round(tokenRatio * 100) / 100,
    foundInChunk: false,
    note: 'No evidence found: quote does not exist in the cited source chunk',
  };
}

/**
 * Validates all citations for a claim against the authoritative chunks.
 * Enforces rule: "Claims whose citations fail validation must never be shown as Verified."
 */
export function verifyClaim(claim: Claim, chunksMap: Map<string, Chunk>): Claim {
  if (!claim.citations || claim.citations.length === 0) {
    return {
      ...claim,
      overallStatus: 'unverified',
      citations: [
        {
          sourceId: 'none',
          chunkId: 'none',
          quote: '',
          validationStatus: 'unverified',
          matchScore: 0,
          validationNote: 'No supporting citations were provided for this claim',
        },
      ],
    };
  }

  // If already flagged as conflict, keep conflict status
  if (claim.overallStatus === 'conflicting') {
    return claim;
  }

  const updatedCitations: Citation[] = claim.citations.map((citation) => {
    const chunk = chunksMap.get(citation.chunkId);
    if (!chunk) {
      return {
        ...citation,
        validationStatus: 'unverified',
        matchScore: 0,
        validationNote: `Cited chunk ${citation.chunkId} does not exist in ingested sources`,
      };
    }

    const verification = verifyQuoteAgainstChunk(citation.quote, chunk.text);
    return {
      ...citation,
      sourceName: chunk.sourceName,
      sourceAccessLevel: chunk.accessLevel,
      validationStatus: verification.status,
      matchScore: verification.matchScore,
      validationNote: verification.note,
    };
  });

  // Calculate overall claim status based strictly on citation validations
  let verifiedCount = 0;
  let partialCount = 0;
  let unverifiedCount = 0;

  for (const c of updatedCitations) {
    if (c.validationStatus === 'verified') verifiedCount++;
    else if (c.validationStatus === 'partial') partialCount++;
    else unverifiedCount++;
  }

  let finalStatus: ClaimStatus = 'unverified';

  if (verifiedCount > 0 && unverifiedCount === 0 && partialCount === 0) {
    finalStatus = 'verified';
  } else if (verifiedCount > 0 || partialCount > 0) {
    finalStatus = 'partial';
  } else {
    finalStatus = 'unverified';
  }

  return {
    ...claim,
    citations: updatedCitations,
    overallStatus: finalStatus,
  };
}
