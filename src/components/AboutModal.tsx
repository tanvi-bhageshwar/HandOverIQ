import React from 'react';
import { X, Layers, ShieldCheck, CheckCircle2, Lock, Cpu, Sparkles } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Layers className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">About HandoverIQ</h3>
              <p className="text-xs text-slate-500 font-mono">Evidence-Linked Knowledge Transfer Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-slate-700 leading-relaxed">
          {/* Executive Overview */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm">The Mission</h4>
            <p>
              When a team member leaves, crucial operational and architectural knowledge vanishes.
              Standard AI summarization tools hallucinate explanations and leak unredacted credentials.
              <strong> HandoverIQ</strong> solves this with an evidence-linked, permission-aware pipeline:
              reconstructing project state with verbatim citations, verifying each claim in code, redacting secrets,
              and gating all sharing behind human sign-off.
            </p>
          </div>

          {/* 4 Trust Principles */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Core Architectural Trust Principles
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-1">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Deterministic Code Verification
                </span>
                <p className="text-slate-600">
                  Every citation quote is verified against source chunks using normalized string matching.
                  Unmatched claims can never be marked as Verified.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 space-y-1">
                <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  Pre-AI Permission Gate
                </span>
                <p className="text-slate-600">
                  Access filtering executes before data leaves the system. Chunks exceeding active role
                  clearance are excluded from the model prompt.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Automated Secrets Redaction
                </span>
                <p className="text-slate-600">
                  Regex engine sanitizes API keys (rzp_*, AIza*, ghp_*), emails, phone numbers, and
                  [CONFIDENTIAL] tagged entries in memory.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/50 space-y-1">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-600" />
                  Human-in-the-Loop Sign-Off
                </span>
                <p className="text-slate-600">
                  AI output is stamped as an unapproved draft. Handover continuation plans cannot be accessed
                  by incoming members until lead reviewers approve.
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Technology Stack
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600 font-mono text-[11px]">
              <div>• React 19 SPA</div>
              <div>• TypeScript 7.0</div>
              <div>• Tailwind CSS v4</div>
              <div>• Express Server</div>
              <div>• Gemini 2.5 / 3.8 Flash</div>
              <div>• @google/genai SDK</div>
            </div>
          </div>

          {/* AI Disclosure */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">AI Tool Disclosure:</strong>
              <span>
                AI engineering assistants (Google AI Studio Build) were utilized in the development, architecture, and code synthesis of HandoverIQ.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700">HandoverIQ</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
