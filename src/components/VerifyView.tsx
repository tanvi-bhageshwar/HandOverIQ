import React, { useState } from 'react';
import { Claim, Citation, Chunk, Conflict, ClaimStatus, UserRole } from '../types';
import { StatusBadge } from './StatusBadge';
import { isClaimHiddenForRole } from '../services/permissions';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  FileSearch,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Lock,
} from 'lucide-react';

interface VerifyViewProps {
  claims: Claim[];
  conflicts: Conflict[];
  chunksMap: Map<string, Chunk>;
  activeRole: UserRole;
  onOpenEvidence: (citation: Citation, chunk: Chunk | null) => void;
  onProceedToReview: () => void;
}

export const VerifyView: React.FC<VerifyViewProps> = ({
  claims,
  conflicts,
  chunksMap,
  activeRole,
  onOpenEvidence,
  onProceedToReview,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | ClaimStatus | 'conflicts'>('all');

  // Metrics
  const totalClaims = claims.length;
  const verifiedCount = claims.filter((c) => c.overallStatus === 'verified').length;
  const partialCount = claims.filter((c) => c.overallStatus === 'partial').length;
  const unverifiedCount = claims.filter((c) => c.overallStatus === 'unverified').length;
  const conflictCount = conflicts.length;

  // Filter claims
  const filteredClaims = claims.filter((c) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'conflicts') return false;
    return c.overallStatus === selectedFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
            <span>Step 3: Deterministic Code Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif">
            Verify Citations Against Ground Truth
          </h1>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Every single claim extracted by AI is verified in deterministic code using normalized string
            matching against the cited source chunk. Claims whose quotes fail validation are never marked as
            Verified.
          </p>
        </div>
      </div>

      {/* Verification Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedFilter === 'all'
              ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-xs text-slate-500 block">Total Claims</span>
          <span className="text-2xl font-bold text-slate-900">{totalClaims}</span>
          <span className="text-[11px] text-slate-400 block mt-1">100% Code Verified</span>
        </button>

        <button
          onClick={() => setSelectedFilter('verified')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedFilter === 'verified'
              ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Verified</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-emerald-700">{verifiedCount}</span>
          <span className="text-[11px] text-emerald-600/80 block mt-1">Exact verbatim quote</span>
        </button>

        <button
          onClick={() => setSelectedFilter('partial')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedFilter === 'partial'
              ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-2 ring-amber-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Partial</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-2xl font-bold text-amber-700">{partialCount}</span>
          <span className="text-[11px] text-amber-600/80 block mt-1">Weak / single mention</span>
        </button>

        <button
          onClick={() => setSelectedFilter('unverified')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedFilter === 'unverified'
              ? 'border-slate-600 bg-slate-100 shadow-xs ring-2 ring-slate-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Unverified</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <span className="text-2xl font-bold text-slate-700">{unverifiedCount}</span>
          <span className="text-[11px] text-slate-500 block mt-1">No evidence found</span>
        </button>

        <button
          onClick={() => setSelectedFilter('conflicts')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedFilter === 'conflicts'
              ? 'border-rose-600 bg-rose-50/50 shadow-xs ring-2 ring-rose-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Conflicts</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <span className="text-2xl font-bold text-rose-700">{conflictCount}</span>
          <span className="text-[11px] text-rose-600/80 block mt-1">Contradictory sources</span>
        </button>
      </div>

      {/* Header and Proceed Action */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <FileSearch className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">
            {selectedFilter === 'conflicts' ? 'Planted Source Contradictions' : 'Claims Verification Inspector'}
          </h2>
        </div>

        <button
          onClick={onProceedToReview}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
        >
          <span>Proceed to Review (Step 4)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Discovered Conflicts Section */}
      {(selectedFilter === 'all' || selectedFilter === 'conflicts') && conflicts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              Contradiction Alert
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Flagged Source Conflicts ({conflicts.length})
            </h3>
          </div>

          {conflicts.map((conf) => (
            <div
              key={conf.id}
              className="p-5 rounded-2xl border-2 border-rose-200 bg-rose-50/30 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Topic: {conf.topic}</span>
                </h4>
                <StatusBadge status="conflicting" size="sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Side A */}
                <div className="p-4 rounded-xl bg-white border border-rose-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Source Perspective A (Task Board)
                  </span>
                  <p className="text-xs font-medium text-slate-900">{conf.claimA.statement}</p>
                  <button
                    onClick={() => {
                      const chunk = chunksMap.get(conf.claimA.citation.chunkId) || null;
                      onOpenEvidence(conf.claimA.citation, chunk);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-mono underline cursor-pointer"
                  >
                    <span>Inspect Citation ({conf.claimA.citation.chunkId})</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Side B */}
                <div className="p-4 rounded-xl bg-white border border-rose-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Source Perspective B (Repository & Notes)
                  </span>
                  <p className="text-xs font-medium text-slate-900">{conf.claimB.statement}</p>
                  <button
                    onClick={() => {
                      const chunk = chunksMap.get(conf.claimB.citation.chunkId) || null;
                      onOpenEvidence(conf.claimB.citation, chunk);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-mono underline cursor-pointer"
                  >
                    <span>Inspect Citation ({conf.claimB.citation.chunkId})</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claims List */}
      {selectedFilter !== 'conflicts' && (
        <div className="space-y-3">
          {filteredClaims.map((claim) => {
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
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-3 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {claim.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{claim.title}</h3>
                  </div>
                  <StatusBadge status={claim.overallStatus} size="sm" />
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

                {/* Evidence Citations Row */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">Supporting Evidence:</span>
                  {claim.citations.map((cit, idx) => {
                    const chunk = chunksMap.get(cit.chunkId) || null;
                    return (
                      <button
                        key={idx}
                        onClick={() => onOpenEvidence(cit, chunk)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                          cit.validationStatus === 'verified'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : cit.validationStatus === 'partial'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                        }`}
                        title="Click to inspect exact quote in source chunk"
                      >
                        <span>{cit.chunkId}</span>
                        <span className="text-[10px] opacity-75">
                          ({Math.round((cit.matchScore || 0) * 100)}% match)
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
