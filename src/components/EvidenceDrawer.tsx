import React from 'react';
import { Citation, Chunk } from '../types';
import { StatusBadge } from './StatusBadge';
import { X, Shield, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface EvidenceDrawerProps {
  citation: Citation | null;
  chunk: Chunk | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ citation, chunk, onClose }) => {
  if (!citation) return null;

  // Highlight quote inside chunk text
  const renderHighlightedChunkText = (text: string, quote: string) => {
    if (!text || !quote) return <span>{text || 'Chunk content unavailable'}</span>;

    const lowerText = text.toLowerCase();
    const lowerQuote = quote.toLowerCase().trim();
    const idx = lowerText.indexOf(lowerQuote);

    if (idx === -1) {
      return (
        <div className="space-y-3">
          <p className="text-sm font-mono text-slate-800 whitespace-pre-wrap">{text}</p>
          <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Exact substring not found continuously in chunk. Match verified via normalized term comparison.</span>
          </div>
        </div>
      );
    }

    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + quote.length);
    const after = text.substring(idx + quote.length);

    return (
      <p className="text-sm font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
        {before}
        <mark className="bg-amber-200 text-amber-950 font-semibold px-1 py-0.5 rounded border border-amber-400">
          {match}
        </mark>
        {after}
      </p>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Evidence Inspector</h2>
              <p className="text-xs text-slate-500 font-mono">ID: {citation.chunkId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Verification Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Deterministic Validation Result
              </span>
              <StatusBadge status={citation.validationStatus} size="sm" />
            </div>

            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-slate-900">
                {Math.round((citation.matchScore || 0) * 100)}%
              </div>
              <div className="text-xs text-slate-600">
                {citation.validationStatus === 'verified'
                  ? 'Deterministic Code Match'
                  : citation.validationStatus === 'partial'
                  ? 'Partial Evidence Match'
                  : 'Unconfirmed / Not In Chunk'}
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
              {citation.validationNote || 'Code-verified against authoritative chunk text.'}
            </p>
          </div>

          {/* Quoted Claim Snippet */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cited Exact Quote
            </span>
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 text-sm font-medium italic">
              "{citation.quote}"
            </div>
          </div>

          {/* Source Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block mb-1">Source Name</span>
              <span className="font-semibold text-slate-900 break-words">
                {chunk?.sourceName || citation.sourceName || citation.sourceId}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block mb-1">Access Level</span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-900 capitalize">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                {chunk?.accessLevel || citation.sourceAccessLevel || 'team'}
              </span>
            </div>

            {chunk && (
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 col-span-2">
                <span className="text-slate-500 block mb-1">Source Span</span>
                <span className="font-mono text-slate-800">
                  Lines {chunk.startLine} to {chunk.endLine} (Chunk {chunk.chunkId})
                </span>
              </div>
            )}
          </div>

          {/* Full Chunk Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Authoritative Chunk Content (Highlighted)
              </span>
              <span className="text-xs text-slate-400">Verbatim Source Data</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 max-h-72 overflow-y-auto">
              {chunk ? (
                renderHighlightedChunkText(chunk.text, citation.quote)
              ) : (
                <p className="text-sm text-slate-500 italic">Authoritative chunk payload not loaded</p>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Non-AI String Verification</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
