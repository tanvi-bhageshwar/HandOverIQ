import React, { useState } from 'react';
import { Claim, Conflict, GapQuestion, UserRole, Citation, Chunk } from '../types';
import { StatusBadge } from './StatusBadge';
import { isClaimHiddenForRole } from '../services/permissions';
import {
  CheckCircle,
  XCircle,
  Edit3,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  Send,
  AlertCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface ReviewViewProps {
  claims: Claim[];
  conflicts: Conflict[];
  gaps: GapQuestion[];
  activeRole: UserRole;
  chunksMap: Map<string, Chunk>;
  onUpdateClaims: (claims: Claim[]) => void;
  onUpdateConflicts: (conflicts: Conflict[]) => void;
  onUpdateGaps: (gaps: GapQuestion[]) => void;
  onApproveHandover: (reviewerName: string) => void;
  onOpenEvidence: (citation: Citation, chunk: Chunk | null) => void;
  onProceedToHandover: () => void;
  isHandoverApproved: boolean;
  onLogAudit: (action: string, details: string) => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  claims,
  conflicts,
  gaps,
  activeRole,
  chunksMap,
  onUpdateClaims,
  onUpdateConflicts,
  onUpdateGaps,
  onApproveHandover,
  onOpenEvidence,
  onProceedToHandover,
  isHandoverApproved,
  onLogAudit,
}) => {
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [editText, setEditText] = useState('');
  const [editTitle, setEditTitle] = useState('');

  const [activeGapId, setActiveGapId] = useState<string | null>(null);
  const [gapAnswerInput, setGapAnswerInput] = useState('');

  const [conflictResolutionInput, setConflictResolutionInput] = useState<Record<string, string>>({});

  const isReviewerRole = activeRole === 'lead' || activeRole === 'admin' || activeRole === 'outgoing';
  const reviewerDisplayName =
    activeRole === 'lead'
      ? 'Priya Nair (Lead Reviewer)'
      : activeRole === 'outgoing'
      ? 'Rohan Mehta (Outgoing Member)'
      : 'Admin';

  // Claim actions
  const handleApproveClaim = (id: string) => {
    const updated = claims.map((c) =>
      c.id === id ? { ...c, humanReviewStatus: 'approved' as const, humanNote: `Approved by ${reviewerDisplayName}` } : c
    );
    onUpdateClaims(updated);
    onLogAudit('APPROVE_CLAIM', `Claim ${id} approved by ${reviewerDisplayName}`);
  };

  const handleRejectClaim = (id: string) => {
    const updated = claims.map((c) =>
      c.id === id ? { ...c, humanReviewStatus: 'rejected' as const, humanNote: `Rejected by ${reviewerDisplayName}` } : c
    );
    onUpdateClaims(updated);
    onLogAudit('REJECT_CLAIM', `Claim ${id} rejected by ${reviewerDisplayName}`);
  };

  const handleStartEdit = (claim: Claim) => {
    setEditingClaim(claim);
    setEditTitle(claim.title);
    setEditText(claim.description);
  };

  const handleSaveEdit = () => {
    if (!editingClaim) return;
    const updated = claims.map((c) =>
      c.id === editingClaim.id
        ? {
            ...c,
            title: editTitle,
            description: editText,
            humanReviewStatus: 'edited' as const,
            humanNote: `Edited by ${reviewerDisplayName}`,
          }
        : c
    );
    onUpdateClaims(updated);
    onLogAudit('EDIT_CLAIM', `Claim ${editingClaim.id} revised by ${reviewerDisplayName}`);
    setEditingClaim(null);
  };

  // Gap answers
  const handleSubmitGapAnswer = (gapId: string) => {
    if (!gapAnswerInput.trim()) return;

    const gap = gaps.find((g) => g.id === gapId);
    if (!gap) return;

    // Update gap status
    const updatedGaps = gaps.map((g) =>
      g.id === gapId
        ? {
            ...g,
            status: 'answered' as const,
            answer: gapAnswerInput,
            answeredBy: reviewerDisplayName,
            answeredAt: new Date().toISOString(),
          }
        : g
    );
    onUpdateGaps(updatedGaps);

    // Also add as human-provided claim
    const newHumanClaim: Claim = {
      id: `claim-human-${Date.now()}`,
      category: 'owner',
      title: `Resolved Gap: ${gap.question}`,
      description: gapAnswerInput,
      accessLevel: 'team',
      overallStatus: 'verified',
      humanReviewStatus: 'approved',
      humanAnswerBy: reviewerDisplayName,
      priority: 'high',
      citations: [
        {
          sourceId: 'human-reviewer',
          chunkId: 'human-input',
          quote: `Human-provided knowledge answer by ${reviewerDisplayName}`,
          validationStatus: 'verified',
          matchScore: 1.0,
          validationNote: `Officially attested by ${reviewerDisplayName}`,
        },
      ],
    };

    onUpdateClaims([...claims, newHumanClaim]);
    onLogAudit('ANSWER_GAP', `Gap question "${gap.question}" resolved by ${reviewerDisplayName}`);
    setActiveGapId(null);
    setGapAnswerInput('');
  };

  // Conflict resolution
  const handleResolveConflict = (conflictId: string) => {
    const resolutionText = conflictResolutionInput[conflictId];
    if (!resolutionText || !resolutionText.trim()) return;

    const updatedConflicts = conflicts.map((conf) =>
      conf.id === conflictId
        ? {
            ...conf,
            resolved: true,
            resolutionNote: resolutionText,
            resolvedBy: reviewerDisplayName,
            resolvedAt: new Date().toISOString(),
          }
        : conf
    );
    onUpdateConflicts(updatedConflicts);
    onLogAudit('RESOLVE_CONFLICT', `Conflict ${conflictId} marked resolved by ${reviewerDisplayName}`);
  };

  const approvedClaimsCount = claims.filter((c) => c.humanReviewStatus === 'approved').length;
  const pendingCount = claims.filter((c) => c.humanReviewStatus === 'pending').length;
  const answeredGapsCount = gaps.filter((g) => g.status === 'answered').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
            <span>Step 4: Human-in-the-Loop Review & Approval Gate</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif">
            Review Draft, Resolve Gaps & Sign Off
          </h1>
          <p className="text-indigo-100 text-sm leading-relaxed">
            AI output is always treated as an unapproved draft. Reviewers must inspect claims, answer missing
            evidence gaps, resolve contradictions, and formally approve the handover before incoming engineers
            can access it.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {isReviewerRole ? (
              <button
                onClick={() => onApproveHandover(reviewerDisplayName)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                  isHandoverApproved
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isHandoverApproved ? '✓ Handover Approved (Re-approve as v2)' : 'Approve Handover (Create v1)'}</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-200 text-xs border border-amber-400/30">
                You are viewing as <strong className="capitalize">{activeRole}</strong>. Switch to{' '}
                <strong>Reviewer (Priya)</strong> or <strong>Admin</strong> in the header to approve.
              </div>
            )}

            {isHandoverApproved && (
              <button
                onClick={onProceedToHandover}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-white text-indigo-950 hover:bg-slate-100 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span>View Approved Handover (Step 5)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Trust & Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-xs text-slate-500 block">Approval Status</span>
          <span className="text-base font-bold text-slate-900 block mt-1">
            {isHandoverApproved ? (
              <span className="text-emerald-700 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Approved for Sharing
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Draft Pending Review
              </span>
            )}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-xs text-slate-500 block">Claims Approved / Total</span>
          <span className="text-base font-bold text-slate-900 block mt-1">
            {approvedClaimsCount} of {claims.length} claims accepted
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-xs text-slate-500 block">Knowledge Gaps Resolved</span>
          <span className="text-base font-bold text-slate-900 block mt-1">
            {answeredGapsCount} of {gaps.length} questions answered
          </span>
        </div>
      </div>

      {/* Open Knowledge Gaps Section (Missing Evidence) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Identified Knowledge Gaps ({gaps.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            System flagged items with zero evidence in ingested sources
          </span>
        </div>

        <div className="space-y-3">
          {gaps.map((gap) => (
            <div
              key={gap.id}
              className={`p-5 rounded-2xl border transition-all ${
                gap.status === 'answered'
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-amber-200 bg-amber-50/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      gap.urgency === 'critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {gap.urgency} Urgency
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{gap.question}</h4>
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                    gap.status === 'answered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {gap.status === 'answered' ? 'Answered by Human' : 'Open Question'}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-2">{gap.context}</p>

              {gap.status === 'answered' ? (
                <div className="mt-3 p-3.5 rounded-xl bg-white border border-emerald-200 text-xs text-slate-800">
                  <div className="flex items-center justify-between font-semibold text-emerald-800 mb-1">
                    <span>Human Answer (Attested by {gap.answeredBy}):</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(gap.answeredAt || '').toLocaleDateString()}
                    </span>
                  </div>
                  <p>{gap.answer}</p>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-amber-100">
                  {activeGapId === gap.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        placeholder="Provide authoritative clarification for this knowledge gap..."
                        value={gapAnswerInput}
                        onChange={(e) => setGapAnswerInput(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-indigo-600"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setActiveGapId(null);
                            setGapAnswerInput('');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSubmitGapAnswer(gap.id)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Attestation</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveGapId(gap.id);
                        if (gap.id === 'gap-1') {
                          setGapAnswerInput(
                            'Dean approved handover: Kabir Sen will lead student liaison for the Razorpay GST invoice, and Priya Nair will submit the contract renewal package before the Nov 15 deadline.'
                          );
                        } else {
                          setGapAnswerInput('');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Answer Knowledge Gap as {reviewerDisplayName}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Discovered Conflicts Resolution */}
      {conflicts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-900">Resolve Source Contradictions</h2>
          </div>

          {conflicts.map((conf) => (
            <div
              key={conf.id}
              className="p-5 rounded-2xl border border-rose-200 bg-rose-50/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-rose-950">Topic: {conf.topic}</h4>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                    conf.resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {conf.resolved ? 'Resolved by Reviewer' : 'Unresolved Contradiction'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white border border-rose-100">
                  <span className="font-semibold text-slate-500 block mb-1">Perspective A (Tasks)</span>
                  <p className="text-slate-900 font-medium">{conf.claimA.statement}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-rose-100">
                  <span className="font-semibold text-slate-500 block mb-1">Perspective B (Repo / Notes)</span>
                  <p className="text-slate-900 font-medium">{conf.claimB.statement}</p>
                </div>
              </div>

              {conf.resolved ? (
                <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs text-slate-800">
                  <span className="font-semibold text-emerald-800 block mb-0.5">
                    Official Determination (Resolved by {conf.resolvedBy}):
                  </span>
                  <p>{conf.resolutionNote}</p>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-rose-100">
                  <input
                    type="text"
                    placeholder="Enter official resolution determination (e.g., Confirmed: Waitlist is incomplete on branch feature/waitlist)"
                    value={
                      conflictResolutionInput[conf.id] ||
                      'Confirmed: Waitlist is UNFINISHED on branch feature/waitlist. Disregard CSV marked complete; postponed to v1.2.'
                    }
                    onChange={(e) =>
                      setConflictResolutionInput({ ...conflictResolutionInput, [conf.id]: e.target.value })
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-indigo-600 bg-white"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleResolveConflict(conf.id)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm cursor-pointer"
                    >
                      Record Official Resolution
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Claim Moderation List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Extracted Claims Moderation ({claims.length})</h2>
          <span className="text-xs text-slate-500">Edit, Reject, or Approve claims for the continuation plan</span>
        </div>

        <div className="space-y-3">
          {claims.map((claim) => {
            const isHidden = isClaimHiddenForRole(claim, activeRole);

            if (isHidden) {
              return (
                <div
                  key={claim.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-between text-slate-500"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold">
                      1 item hidden: requires higher access clearance ({claim.accessLevel})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 italic">Protected by Pre-AI Gate</span>
                </div>
              );
            }

            return (
              <div
                key={claim.id}
                className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  claim.humanReviewStatus === 'approved'
                    ? 'border-emerald-200 bg-white shadow-xs'
                    : claim.humanReviewStatus === 'rejected'
                    ? 'border-slate-200 bg-slate-50 opacity-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {claim.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{claim.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={claim.overallStatus} size="sm" />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        claim.humanReviewStatus === 'approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : claim.humanReviewStatus === 'rejected'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {claim.humanReviewStatus}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{claim.description}</p>

                {claim.rationale && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                    <strong className="text-amber-900 font-semibold block mb-0.5">
                      Decision Rationale (The WHY):
                    </strong>
                    <span>{claim.rationale}</span>
                  </div>
                )}

                {/* Citations & Moderation Bar */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400">Evidence:</span>
                    {claim.citations.map((cit, idx) => {
                      const chunk = chunksMap.get(cit.chunkId) || null;
                      return (
                        <button
                          key={idx}
                          onClick={() => onOpenEvidence(cit, chunk)}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          <span>{cit.chunkId}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions for Reviewer */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(claim)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {claim.humanReviewStatus !== 'rejected' && (
                      <button
                        onClick={() => handleRejectClaim(claim.id)}
                        className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-medium text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Reject</span>
                      </button>
                    )}

                    {claim.humanReviewStatus !== 'approved' && (
                      <button
                        onClick={() => handleApproveClaim(claim.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Approve</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Claim Modal */}
      {editingClaim && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Edit Handover Claim</h3>
              <button
                onClick={() => setEditingClaim(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Claim Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-slate-900 border-slate-300 focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-slate-900 border-slate-300 focus:outline-indigo-600"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2">
              <button
                onClick={() => setEditingClaim(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm"
              >
                Save Revisions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
