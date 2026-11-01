import React, { useState } from 'react';
import { Claim, Conflict, GapQuestion, HandoverVersion, ProjectState, UserRole, Citation, Chunk } from '../types';
import { StatusBadge } from './StatusBadge';
import { isClaimHiddenForRole, ROLE_LABELS } from '../services/permissions';
import { generateMarkdownExport } from '../services/store';
import {
  Download,
  CheckCircle2,
  Lock,
  Calendar,
  AlertTriangle,
  UserCheck,
  PhoneCall,
  Clock,
  ListChecks,
  History,
  FileText,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

interface HandoverViewProps {
  projectState: ProjectState;
  activeRole: UserRole;
  chunksMap: Map<string, Chunk>;
  onAcknowledge: (recipientName: string) => void;
  onOpenEvidence: (citation: Citation, chunk: Chunk | null) => void;
  onLogAudit: (action: string, details: string) => void;
}

export const HandoverView: React.FC<HandoverViewProps> = ({
  projectState,
  activeRole,
  chunksMap,
  onAcknowledge,
  onOpenEvidence,
  onLogAudit,
}) => {
  const [activeTab, setActiveTab] = useState<
    'plan' | 'matrix' | 'problems' | 'contacts' | 'timeline' | 'versions'
  >('plan');

  const incomingName = 'Ananya Rao (Incoming Platform Engineer)';
  const latestVersion =
    projectState.versions.length > 0
      ? projectState.versions[projectState.versions.length - 1]
      : null;

  const isAcknowledged = Boolean(latestVersion?.acknowledgedBy);

  // Filter approved claims (or active claims if version created)
  const sourceClaims = latestVersion ? latestVersion.claims : projectState.claims;
  const approvedClaims = sourceClaims.filter((c) => c.humanReviewStatus !== 'rejected');

  const visibleClaims = approvedClaims.filter((c) => !isClaimHiddenForRole(c, activeRole));
  const hiddenCount = approvedClaims.length - visibleClaims.length;

  // Filter by category
  const decisions = visibleClaims.filter((c) => c.category === 'decision');
  const risks = visibleClaims.filter((c) => c.category === 'risk');
  const recurringProblems = visibleClaims.filter((c) => c.category === 'recurring_problem');
  const contacts = visibleClaims.filter((c) => c.category === 'contact');
  const nextActions = visibleClaims.filter((c) => c.category === 'next_action');
  const timeline = visibleClaims.filter((c) => c.category === 'timeline');

  // Exports
  const handleDownloadMarkdown = () => {
    const md = generateMarkdownExport(projectState, activeRole);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HandoverIQ_${projectState.projectName.replace(/\s+/g, '_')}_v${latestVersion?.versionNumber || 1}.md`;
    link.click();
    URL.revokeObjectURL(url);
    onLogAudit('EXPORT_MARKDOWN', `Exported handover continuation plan as Markdown`);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(
      {
        projectName: projectState.projectName,
        version: latestVersion?.versionNumber || 1,
        approvedBy: latestVersion?.approvedBy,
        approvedAt: latestVersion?.approvedAt,
        acknowledgedBy: latestVersion?.acknowledgedBy,
        acknowledgedAt: latestVersion?.acknowledgedAt,
        claims: visibleClaims,
        conflicts: projectState.conflicts,
        gaps: projectState.gaps,
      },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HandoverIQ_${projectState.projectName.replace(/\s+/g, '_')}_v${latestVersion?.versionNumber || 1}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onLogAudit('EXPORT_JSON', `Exported handover continuation plan as JSON`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Step 5: Approved Continuation Plan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif">
            Project Continuation Plan & Handoff
          </h1>
          <p className="text-indigo-200 text-sm leading-relaxed">
            Personalized, role-tailored roadmap for incoming engineers. Contains verified architectural
            rationale, active risks, production incident runbooks, and first-week execution milestones.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {/* Acknowledge Receipt Button */}
            <button
              onClick={() => onAcknowledge(incomingName)}
              disabled={isAcknowledged}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                isAcknowledged
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>
                {isAcknowledged
                  ? `✓ Acknowledged by ${latestVersion?.acknowledgedBy || 'Incoming Member'}`
                  : 'Acknowledge Receipt (Incoming Member)'}
              </span>
            </button>

            {/* Export Buttons */}
            <button
              onClick={handleDownloadMarkdown}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Markdown</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Permission Clearance Notice */}
      <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-indigo-950">
          <span className="font-bold">Active Viewer:</span>
          <span>{ROLE_LABELS[activeRole].title}</span>
          <span className="text-slate-400">•</span>
          <span className="font-semibold">{ROLE_LABELS[activeRole].clearanceLabel}</span>
        </div>

        {hiddenCount > 0 ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>{hiddenCount} item hidden: requires higher access</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>All items within active clearance</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2">
        {[
          { key: 'plan', label: 'Continuation Plan', icon: ListChecks },
          { key: 'problems', label: 'Recurring Problems & Fixes', icon: Terminal },
          { key: 'contacts', label: 'Key Contacts', icon: PhoneCall },
          { key: 'matrix', label: 'Ownership & Tasks', icon: UserCheck },
          { key: 'timeline', label: 'Timeline & Milestones', icon: Calendar },
          { key: 'versions', label: `Version History (${projectState.versions.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Hidden Items Notice for Incoming Member */}
      {hiddenCount > 0 && (
        <div className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>
              <strong>1 item hidden: requires higher access</strong> (Classification: Lead-Only).
              Financial deposit and vendor contractual penalties are masked for team-level clearance.
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-700">Pre-AI Filtered</span>
        </div>
      )}

      {/* Tab 1: Continuation Plan */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {/* First Week Onboarding Checklist */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-indigo-600" />
                <span>First-Week Onboarding Checklist for {incomingName}</span>
              </h3>
              <span className="text-xs text-slate-400">Curated by Outgoing & Lead</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-indigo-600" />
                <span className="text-slate-800">
                  Clone \`techfest-backend\` and verify Redis connection string with persistent AOF logging enabled.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-indigo-600" />
                <span className="text-slate-800">
                  Review Meeting Notes ADR: Razorpay chosen over Stripe India due to lower 2.0% fees & UPI autopay.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <input type="checkbox" className="mt-0.5 rounded text-indigo-600" />
                <span className="text-slate-800">
                  Simulate Monday morning Redis timeout fix: test 45-sec recovery (\`docker restart\` + \`npm run queue:flush-stale-leases\`).
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <input type="checkbox" className="mt-0.5 rounded text-indigo-600" />
                <span className="text-slate-800">
                  Complete Task TF-105: Raise student verification rate limit on \`/api/verify-student\` to 250 req/min before ticket launch.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <input type="checkbox" className="mt-0.5 rounded text-indigo-600" />
                <span className="text-slate-800">
                  Introduce yourself to Kabir Sen (#sponsorships, ext 442) and Meera Joshi (#infra-ops, Slack @meeraj).
                </span>
              </label>
            </div>
          </div>

          {/* Architectural Decisions & The WHY */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Core Architectural Decisions & The WHY</h3>
            <div className="grid grid-cols-1 gap-3">
              {decisions.map((d) => (
                <div key={d.id} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{d.title}</h4>
                    <StatusBadge status={d.overallStatus} size="sm" />
                  </div>
                  <p className="text-xs text-slate-700">{d.description}</p>
                  {d.rationale && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                      <strong className="text-amber-900 block mb-0.5">Underlying Rationale / WHY:</strong>
                      <span>{d.rationale}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">Citations: {d.citations.map((c) => c.chunkId).join(', ')}</span>
                    <button
                      onClick={() => {
                        const cit = d.citations[0];
                        const chunk = cit ? chunksMap.get(cit.chunkId) || null : null;
                        if (cit) onOpenEvidence(cit, chunk);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      View Source Evidence
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Priority Risks */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Active Risks & Production Blockers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {risks.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                      {r.priority || 'High'} Severity
                    </span>
                    <StatusBadge status={r.overallStatus} size="sm" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{r.title}</h4>
                  <p className="text-xs text-slate-600">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Recurring Problems & Fixes */}
      {activeTab === 'problems' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Recurring Operational Problems & Documented Fixes
              </h3>
              <p className="text-xs text-slate-500">
                Step-by-step incident response runbooks confirmed from engineering chat and commit history.
              </p>
            </div>
          </div>

          {recurringProblems.map((rp) => (
            <div key={rp.id} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">{rp.title}</h4>
                <StatusBadge status={rp.overallStatus} size="sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 space-y-1">
                  <span className="font-bold text-rose-900 block">Symptom & Root Cause</span>
                  <p className="text-rose-800">
                    {rp.extra?.symptom || rp.description}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                  <span className="font-bold text-emerald-900 block">Known Fix Procedure (45 Seconds)</span>
                  <p className="text-emerald-800 font-mono text-[11px]">
                    {rp.extra?.knownFix || 'Documented in incident runbook.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono text-[11px]">
                  Confirmed by Outgoing Member Rohan Mehta in #dev-backend
                </span>
                <button
                  onClick={() => {
                    const cit = rp.citations[0];
                    const chunk = cit ? chunksMap.get(cit.chunkId) || null : null;
                    if (cit) onOpenEvidence(cit, chunk);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Inspect Chat Citation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Key Contacts */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Project Directory (Who to Ask For What)</h3>
            <p className="text-xs text-slate-500">Authoritative leads for domains, credentials, and passes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {c.extra?.contactName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{c.extra?.contactName || c.title}</h4>
                      <span className="text-xs text-indigo-600 font-medium">
                        {c.extra?.contactHandle || '#general'}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={c.overallStatus} size="sm" />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                  <span className="font-semibold text-slate-500 block mb-0.5">Area of Responsibility:</span>
                  <p>{c.extra?.contactDomain || c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Ownership & Tasks */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ownership & Dependency Matrix</h3>
            <p className="text-xs text-slate-500">Upcoming tasks and immediate next actions in priority order.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Action Item</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Assigned Owner</th>
                  <th className="p-3.5">Target Due Date</th>
                  <th className="p-3.5 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nextActions.map((na) => (
                  <tr key={na.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-medium text-slate-900">{na.title}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                        {na.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700">{na.extra?.owner || 'Ananya Rao'}</td>
                    <td className="p-3.5 text-slate-600 font-mono">{na.extra?.dueDate || '2026-11-10'}</td>
                    <td className="p-3.5 text-right">
                      <StatusBadge status={na.overallStatus} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Timeline & Milestone Verification</h3>
            <p className="text-xs text-slate-500">Distinguishes official schedule from unconfirmed rumours.</p>
          </div>

          <div className="space-y-3">
            {timeline.map((t) => (
              <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                  <StatusBadge status={t.overallStatus} size="sm" />
                </div>
                <p className="text-xs text-slate-600">{t.description}</p>
                {t.rationale && (
                  <div className="p-2.5 rounded-lg bg-amber-50 text-[11px] text-amber-900 border border-amber-200">
                    <strong>Note:</strong> {t.rationale}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Version History */}
      {activeTab === 'versions' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Immutable Version History</h3>
            <p className="text-xs text-slate-500">Every approved continuation plan is permanently recorded.</p>
          </div>

          <div className="space-y-3">
            {projectState.versions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                No approved versions generated yet. Go to <strong>Step 4: Review</strong> and click "Approve Handover".
              </div>
            ) : (
              projectState.versions.map((ver) => (
                <div key={ver.versionNumber} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-700">
                      Version {ver.versionNumber}.0 ({ver.versionLabel})
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Approved: {new Date(ver.approvedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <span>Approved by: <strong>{ver.approvedBy}</strong></span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between">
                    <span>
                      Acknowledgement Status:{' '}
                      {ver.acknowledgedBy ? (
                        <strong className="text-emerald-700">
                          Acknowledged by {ver.acknowledgedBy} on {new Date(ver.acknowledgedAt || '').toLocaleDateString()}
                        </strong>
                      ) : (
                        <span className="text-amber-700 font-semibold">Pending incoming member signature</span>
                      )}
                    </span>
                    <span className="font-mono text-slate-400">{ver.claims.length} claims locked</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
