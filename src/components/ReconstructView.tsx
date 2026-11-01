import React, { useState } from 'react';
import { Source, UserRole, Claim, Conflict, GapQuestion } from '../types';
import { filterChunksForRole } from '../services/permissions';
import { reconstructProjectState } from '../services/gemini';
import { CACHED_DEMO_RESULT } from '../services/cachedDemoResult';
import { verifyClaim } from '../services/verify';
import {
  Cpu,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  Zap,
} from 'lucide-react';

interface ReconstructViewProps {
  sources: Source[];
  activeRole: UserRole;
  projectName: string;
  claims: Claim[];
  conflicts: Conflict[];
  gaps: GapQuestion[];
  onReconstructionComplete: (claims: Claim[], conflicts: Conflict[], gaps: GapQuestion[]) => void;
  onProceedToVerify: () => void;
  onLogAudit: (action: string, details: string) => void;
}

export const ReconstructView: React.FC<ReconstructViewProps> = ({
  sources,
  activeRole,
  projectName,
  claims,
  conflicts,
  gaps,
  onReconstructionComplete,
  onProceedToVerify,
  onLogAudit,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastReconstructStats, setLastReconstructStats] = useState<{
    duration: number;
    model: string;
    timestamp: string;
  } | null>(null);

  // Flatten chunks
  const allChunks = sources.flatMap((s) => s.chunks);
  const authorizedChunks = filterChunksForRole(allChunks, activeRole);
  const withheldCount = allChunks.length - authorizedChunks.length;

  const chunksMap = new Map();
  for (const c of allChunks) {
    chunksMap.set(c.chunkId, c);
  }

  // Handle Real Gemini Reconstruction Call
  const handleRunReconstruction = async () => {
    setIsProcessing(true);
    setErrorNotice(null);
    setElapsedSeconds(0);
    const startTime = Date.now();

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => +(prev + 0.1).toFixed(1));
    }, 100);

    setCurrentStage('Enforcing pre-AI clearance firewall...');

    try {
      await new Promise((r) => setTimeout(r, 300));
      setCurrentStage(`Submitting ${authorizedChunks.length} sanitized chunks to Gemini API in real-time...`);

      const result = await reconstructProjectState(
        authorizedChunks,
        projectName,
        chunksMap
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to complete project reconstruction.');
      }

      setCurrentStage('Performing real-time deterministic quote verification in code...');
      await new Promise((r) => setTimeout(r, 300));

      const duration = +((Date.now() - startTime) / 1000).toFixed(1);
      setLastReconstructStats({
        duration,
        model: result.modelUsed || 'gemini-2.5-flash',
        timestamp: new Date().toLocaleTimeString(),
      });

      onReconstructionComplete(result.claims, result.conflicts, result.gaps);
      onLogAudit(
        'RECONSTRUCT_PROJECT',
        `Reconstructed "${projectName}" with Gemini ${result.modelUsed || 'Flash'} in ${duration}s (${result.claims.length} claims, ${result.conflicts.length} conflicts, ${result.gaps.length} gaps)`
      );
    } catch (err: any) {
      console.error('Reconstruction failed:', err);
      setErrorNotice(err.message || 'Failed to complete Gemini reconstruction.');
    } finally {
      clearInterval(timer);
      setIsProcessing(false);
      setCurrentStage('');
    }
  };

  // Instant Cached Demo Result Fallback
  const handleLoadCachedDemo = () => {
    setErrorNotice(null);
    // Pre-verify cached claims against chunksMap
    const verifiedClaims = CACHED_DEMO_RESULT.claims.map((claim) => verifyClaim(claim, chunksMap));

    onReconstructionComplete(verifiedClaims, CACHED_DEMO_RESULT.conflicts, CACHED_DEMO_RESULT.gaps);
    onLogAudit(
      'LOAD_CACHED_DEMO_RECONSTRUCTION',
      `Loaded cached demo extraction (${verifiedClaims.length} claims, ${CACHED_DEMO_RESULT.conflicts.length} conflicts, ${CACHED_DEMO_RESULT.gaps.length} gaps)`
    );
  };

  const hasExtractedData = claims.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
            <span>Step 2: AI State Reconstruction</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif">
            Reconstruct Ground-Truth Knowledge
          </h1>
          <p className="text-indigo-200 text-sm leading-relaxed">
            Gemini parses the authorized source chunks to extract architectural decisions with their underlying
            WHY, owners, recurring problems and their fixes, key contacts, and unfinished work. Missing evidence
            is flagged as explicit gaps rather than hallucinated answers.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunReconstruction}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-indigo-500 hover:bg-indigo-400 text-white transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Cpu className="w-4 h-4" />
              <span>{isProcessing ? 'Reconstructing...' : 'Run Gemini Reconstruction'}</span>
            </button>

            <button
              onClick={handleLoadCachedDemo}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              title="Instant zero-latency demo result"
            >
              <Zap className="w-4 h-4 text-slate-950" />
              <span>Use Cached Demo Result (Instant)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pre-AI Firewall Transparency Panel */}
      <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-950">
              Pre-AI Role Clearance Firewall Active
            </h3>
            <p className="text-xs text-indigo-900/80 mt-0.5 max-w-xl">
              Only chunks authorized for <strong className="capitalize">{activeRole}</strong> ({authorizedChunks.length} of {allChunks.length}) are sent to the AI.
              {withheldCount > 0 ? (
                <span className="text-amber-800 font-semibold block mt-1">
                  🔒 {withheldCount} higher-clearance chunk(s) withheld before transmission.
                </span>
              ) : (
                <span className="text-emerald-800 font-semibold block mt-1">
                  ✓ Full access: All {allChunks.length} chunks accessible under current role.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono shrink-0 bg-white px-3 py-2 rounded-xl border border-indigo-200">
          <span className="text-slate-500">Model:</span>
          <span className="font-bold text-indigo-700">gemini-2.5-flash</span>
        </div>
      </div>

      {/* Processing Animation */}
      {isProcessing && (
        <div className="p-8 rounded-2xl border border-indigo-200 bg-white shadow-lg space-y-4 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 animate-spin">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="text-base font-bold text-slate-900">Streaming Real-Time Reconstruction</h3>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">{currentStage}</p>
            <div className="mt-2 text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 inline-block px-3 py-1 rounded-full border border-indigo-200">
              Elapsed: {elapsedSeconds}s • Active API Connection
            </div>
          </div>
          <div className="max-w-md mx-auto w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-600 h-2 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      )}

      {/* Live Real-time Telemetry Banner */}
      {lastReconstructStats && !isProcessing && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">
              Live AI Reconstruct Verified: Generated in {lastReconstructStats.duration}s via {lastReconstructStats.model}
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700">
            Real-time API response at {lastReconstructStats.timestamp}
          </span>
        </div>
      )}

      {/* Error Alert */}
      {errorNotice && (
        <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Reconstruction Error</h4>
              <p className="text-xs mt-1 text-rose-800">{errorNotice}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleRunReconstruction}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
            >
              Try Again
            </button>
            <button
              onClick={handleLoadCachedDemo}
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-semibold hover:bg-amber-300"
            >
              Use Cached Demo Result
            </button>
          </div>
        </div>
      )}

      {/* Extraction Results Overview */}
      {hasExtractedData && !isProcessing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Extracted Project Knowledge Base</h2>
              <p className="text-xs text-slate-500">
                {claims.length} claims extracted with verbatim source citations, {conflicts.length} conflict(s), and {gaps.length} knowledge gap(s).
              </p>
            </div>
            <button
              onClick={onProceedToVerify}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              <span>Inspect Verifications (Step 3)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs text-slate-500 block">Total Claims</span>
              <span className="text-2xl font-bold text-slate-900">{claims.length}</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs text-slate-500 block">Identified Gaps</span>
              <span className="text-2xl font-bold text-amber-600">{gaps.length}</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs text-slate-500 block">Planted Conflicts</span>
              <span className="text-2xl font-bold text-rose-600">{conflicts.length}</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs text-slate-500 block">Status</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 inline-block mt-1">
                Ready for Verification
              </span>
            </div>
          </div>

          {/* Quick list preview */}
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {claims.slice(0, 4).map((c) => (
              <div key={c.id} className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {c.category.replace('_', ' ')}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">{c.description}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {c.citations.length} citation(s)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
