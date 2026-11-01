export type UserRole = 'admin' | 'outgoing' | 'lead' | 'incoming';

export type AccessLevel = 'public' | 'team' | 'lead-only' | 'admin-only';

export type SourceType = 'repo' | 'tasks' | 'notes' | 'chat' | 'doc';

export type ClaimStatus = 'verified' | 'partial' | 'unverified' | 'conflicting';

export type HumanReviewStatus = 'pending' | 'approved' | 'rejected' | 'edited';

export type ClaimCategory =
  | 'decision'
  | 'owner'
  | 'unfinished_work'
  | 'dependency'
  | 'risk'
  | 'recurring_problem'
  | 'contact'
  | 'timeline'
  | 'next_action';

export interface Chunk {
  chunkId: string;
  sourceId: string;
  sourceName: string;
  text: string;
  startLine: number;
  endLine: number;
  accessLevel: AccessLevel;
  redactionsCount: number;
}

export interface RedactionStat {
  type: 'API Key / Token' | 'Email Address' | 'Phone Number' | 'Confidential Marker';
  count: number;
}

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  accessLevel: AccessLevel;
  content: string;
  originalContent?: string;
  chunks: Chunk[];
  redactions: RedactionStat[];
  createdAt: string;
}

export interface Citation {
  sourceId: string;
  sourceName?: string;
  chunkId: string;
  quote: string;
  validationStatus: ClaimStatus;
  matchScore: number; // 0 to 1
  validationNote?: string;
  sourceAccessLevel?: AccessLevel;
}

export interface Claim {
  id: string;
  category: ClaimCategory;
  title: string;
  description: string;
  rationale?: string; // The WHY
  citations: Citation[];
  overallStatus: ClaimStatus;
  accessLevel: AccessLevel; // Highest clearance among supporting chunks
  humanReviewStatus: HumanReviewStatus;
  humanNote?: string;
  humanAnswerBy?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  extra?: {
    owner?: string;
    status?: string;
    branch?: string;
    dueDate?: string;
    blockedBy?: string;
    symptom?: string;
    rootCause?: string;
    knownFix?: string;
    contactName?: string;
    contactDomain?: string;
    contactHandle?: string;
    milestoneDate?: string;
    event?: string;
  };
}

export interface Conflict {
  id: string;
  topic: string;
  claimA: {
    statement: string;
    citation: Citation;
  };
  claimB: {
    statement: string;
    citation: Citation;
  };
  resolved: boolean;
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface GapQuestion {
  id: string;
  question: string;
  context: string;
  urgency: 'critical' | 'high' | 'medium';
  status: 'open' | 'answered';
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
}

export interface HandoverVersion {
  versionNumber: number;
  versionLabel: string;
  approvedBy: string;
  approvedAt: string;
  claims: Claim[];
  gaps: GapQuestion[];
  conflicts: Conflict[];
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  role: UserRole;
  actor: string;
  action: string;
  details: string;
}

export interface ProjectState {
  projectName: string;
  projectDescription: string;
  outgoingPerson: string;
  incomingPerson: string;
  leadPerson: string;
  sources: Source[];
  claims: Claim[];
  conflicts: Conflict[];
  gaps: GapQuestion[];
  versions: HandoverVersion[];
  currentDraftStatus: 'not_started' | 'reconstructing' | 'extracted' | 'verified' | 'reviewing' | 'approved';
  auditLog: AuditLogEntry[];
  lastReconstructedAt?: string;
}
