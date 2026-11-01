import React from 'react';
import { UserRole, AuditLogEntry } from '../types';
import { ROLE_LABELS } from '../services/permissions';
import {
  ShieldAlert,
  Users,
  RotateCcw,
  BookOpen,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  onResetDemo: () => void;
  onOpenAuditLog: () => void;
  onOpenAbout: () => void;
  totalRedactions: number;
  auditCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  onRoleChange,
  currentStep,
  onStepChange,
  onResetDemo,
  onOpenAuditLog,
  onOpenAbout,
  totalRedactions,
  auditCount,
}) => {
  const steps = [
    { num: 1, label: '1. Connect' },
    { num: 2, label: '2. Reconstruct' },
    { num: 3, label: '3. Verify' },
    { num: 4, label: '4. Review' },
    { num: 5, label: '5. Handover' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-serif">
                  HandoverIQ
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  v1.2
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Real-Time Engine</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ground-truth project state transfer with verifiable source citations
              </p>
            </div>
          </div>

          {/* Role Switcher Pill Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-500">
              <Users className="w-3.5 h-3.5" />
              <span>Simulated Role:</span>
            </div>
            {(['admin', 'outgoing', 'lead', 'incoming'] as UserRole[]).map((role) => {
              const active = activeRole === role;
              const label =
                role === 'admin'
                  ? 'Admin'
                  : role === 'outgoing'
                  ? 'Outgoing (Rohan)'
                  : role === 'lead'
                  ? 'Reviewer (Priya)'
                  : 'Incoming (Ananya)';
              return (
                <button
                  key={role}
                  onClick={() => onRoleChange(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-indigo-900 shadow-xs font-bold border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title={ROLE_LABELS[role].subtitle}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Utility Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAbout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              title="About HandoverIQ & Verification Architecture"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>How it works</span>
            </button>

            <button
              onClick={onOpenAuditLog}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Inspect Audit Log"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Audit Log</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
                {auditCount}
              </span>
            </button>

            <button
              onClick={onResetDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
              title="Reset to clean demo data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Workflow Stepper Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center gap-1 sm:gap-2">
            {steps.map((st) => {
              const isActive = currentStep === st.num;
              const isPast = currentStep > st.num;
              return (
                <button
                  key={st.num}
                  onClick={() => onStepChange(st.num)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isPast
                      ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>{st.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Active Role Clearance Pill */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Clearance:</span>
            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${ROLE_LABELS[activeRole].badgeColor}`}>
              {ROLE_LABELS[activeRole].clearanceLabel}
            </span>
            {totalRedactions > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] border border-slate-200">
                <ShieldAlert className="w-3 h-3 text-amber-500" />
                <span>{totalRedactions} secrets redacted</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
