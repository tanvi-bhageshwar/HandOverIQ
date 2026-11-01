import { RedactionStat } from '../types';

export interface RedactionResult {
  redactedText: string;
  totalRedactions: number;
  stats: RedactionStat[];
}

export function redactSensitiveContent(text: string): RedactionResult {
  let redacted = text;
  let apiKeyCount = 0;
  let emailCount = 0;
  let phoneCount = 0;
  let confidentialCount = 0;

  // 1. API Keys & Tokens:
  // - Razorpay keys: rzp_(test|live)_[a-zA-Z0-9]+
  // - Google AI / Firebase keys: AIza[0-9A-Za-z-_]{35}
  // - GitHub Personal Access Tokens: ghp_[a-zA-Z0-9]{36}
  // - OpenAI/Generic secret keys: sk-[a-zA-Z0-9_-]{20,}
  // - AWS-style: AKIA[0-9A-Z]{16}
  // - Generic Bearer / secret token strings: secret_[a-zA-Z0-9]{16,}

  const apiKeyRegexes = [
    /rzp_(test|live)_[a-zA-Z0-9_-]+/g,
    /AIza[0-9A-Za-z-_]{35}/g,
    /ghp_[a-zA-Z0-9]{30,40}/g,
    /sk-[a-zA-Z0-9_-]{20,}/g,
    /AKIA[0-9A-Z]{16}/g,
    /(api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token)\s*[:=]\s*["']?([a-zA-Z0-9_\-\.]{16,})["']?/gi,
  ];

  for (const regex of apiKeyRegexes) {
    redacted = redacted.replace(regex, (match, p1, p2) => {
      apiKeyCount++;
      if (p2) {
        return `${p1}: [REDACTED_API_KEY]`;
      }
      return '[REDACTED_API_KEY]';
    });
  }

  // 2. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
  redacted = redacted.replace(emailRegex, () => {
    emailCount++;
    return '[REDACTED_EMAIL]';
  });

  // 3. Phone numbers (e.g., +91 98765-43210, +1 (555) 234-5678, 9876543210)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}\b/g;
  redacted = redacted.replace(phoneRegex, (match) => {
    // avoid stripping small dates or numeric IDs
    const digitsOnly = match.replace(/\D/g, '');
    if (digitsOnly.length >= 10 && digitsOnly.length <= 13) {
      phoneCount++;
      return '[REDACTED_PHONE]';
    }
    return match;
  });

  // 4. Lines tagged [CONFIDENTIAL] or [RESTRICTED]
  const confidentialRegex = /\[CONFIDENTIAL\][^\n]*/gi;
  redacted = redacted.replace(confidentialRegex, () => {
    confidentialCount++;
    return '[REDACTED_CONFIDENTIAL_ITEM]';
  });

  const totalRedactions = apiKeyCount + emailCount + phoneCount + confidentialCount;

  const stats: RedactionStat[] = [
    { type: 'API Key / Token', count: apiKeyCount },
    { type: 'Email Address', count: emailCount },
    { type: 'Phone Number', count: phoneCount },
    { type: 'Confidential Marker', count: confidentialCount },
  ];

  return {
    redactedText: redacted,
    totalRedactions,
    stats,
  };
}

/**
 * Split source content into uniform ~8-12 line chunks with stable identifiers.
 */
export function chunkContent(
  sourceId: string,
  sourceName: string,
  content: string,
  accessLevel: 'public' | 'team' | 'lead-only' | 'admin-only',
  linesPerChunk = 10
) {
  const lines = content.split('\n');
  const chunks = [];
  let chunkIndex = 1;

  for (let i = 0; i < lines.length; i += linesPerChunk) {
    const chunkLines = lines.slice(i, i + linesPerChunk);
    const chunkText = chunkLines.join('\n').trim();

    if (!chunkText) continue;

    // Redaction check on chunk
    const redaction = redactSensitiveContent(chunkText);

    chunks.push({
      chunkId: `${sourceId}-C${chunkIndex}`,
      sourceId,
      sourceName,
      text: redaction.redactedText,
      startLine: i + 1,
      endLine: Math.min(i + linesPerChunk, lines.length),
      accessLevel,
      redactionsCount: redaction.totalRedactions,
    });

    chunkIndex++;
  }

  return chunks;
}
