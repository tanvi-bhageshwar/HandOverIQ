import React, { useState, useEffect, useMemo } from 'react';
import {
  ProjectState,
  UserRole,
  Citation,
  Chunk,
  Claim,
  Conflict,
  GapQuestion,
  HandoverVersion,
} from './types';
import {
  loadProjectState,
  saveProjectState,
  resetDemoState,
  logAudit,
} from './services/store';
import { buildDemoSources } from './services/demoData';
import { Header } from './components/Header';
import { ConnectView } from './components/ConnectView';
import { ReconstructView } from './components/ReconstructView';
import { VerifyView } from './components/VerifyView';
import { ReviewView } from './components/ReviewView';
import { HandoverView } from './components/HandoverView';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { AuditLogModal } from './components/AuditLogModal';
import { AboutModal } from './components/AboutModal';

export default function App() {
  const [projectState, setProjectState] = useState<ProjectState>(() => loadProjectState());
  const [activeRole, setActiveRole] = useState<UserRole>('lead');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Modals & Drawers
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);

  // Sync state to localStorage on update
  useEffect(() => {
    saveProjectState(projectState);
  }, [projectState]);

  // Lookup map for fast chunk access during quote verification & drawer inspection
  const chunksMap = useMemo(() => {
    const map = new Map<string, Chunk>();
    for (const source of projectState.sources) {
      for (const chunk of source.chunks) {
        map.set(chunk.chunkId, chunk);
      }
    }
    return map;
  }, [projectState.sources]);

  // Total redactions tally across all sources
  const totalRedactions = useMemo(() => {
    return projectState.sources.reduce((sum, s) => {
      const sourceTotal = s.redactions.reduce((rSum, r) => rSum + r.count, 0);
      return sum + sourceTotal;
    }, 0);
  }, [projectState.sources]);

  // Handover Approval Status
  const isHandoverApproved = projectState.versions.length > 0;

  // Audit Logger Wrapper
  const handleLogAudit = (action: string, details: string) => {
    const actorName =
      activeRole === 'lead'
        ? 'Priya Nair (Lead Reviewer)'
        : activeRole === 'outgoing'
        ? 'Rohan Mehta (Outgoing Member)'
        : activeRole === 'incoming'
        ? 'Ananya Rao (Incoming Member)'
        : 'Admin (Club President)';

    const updated = logAudit(projectState, activeRole, actorName, action, details);
    setProjectState(updated);
  };

  // Reset demo state
  const handleResetDemo = () => {
    const fresh = resetDemoState();
    setProjectState(fresh);
    setCurrentStep(1);
    setSelectedCitation(null);
  };

  // Load demo project
  const handleLoadDemoProject = () => {
    const freshSources = buildDemoSources();
    const updated = {
      ...projectState,
      sources: freshSources,
    };
    setProjectState(updated);
    handleLogAudit('LOAD_DEMO_SOURCES', 'Loaded 6 synthetic sources for TechFest 2026 Registration Platform');
  };

  // Update sources
  const handleUpdateSources = (newSources: typeof projectState.sources) => {
    setProjectState((prev) => ({
      ...prev,
      sources: newSources,
    }));
  };

  // When reconstruction finishes
  const handleReconstructionComplete = (
    newClaims: Claim[],
    newConflicts: Conflict[],
    newGaps: GapQuestion[]
  ) => {
    setProjectState((prev) => ({
      ...prev,
      claims: newClaims,
      conflicts: newConflicts,
      gaps: newGaps,
      currentDraftStatus: 'extracted',
      lastReconstructedAt: new Date().toISOString(),
    }));
  };

  // Claims & Gap updates during human review
  const handleUpdateClaims = (newClaims: Claim[]) => {
    setProjectState((prev) => ({
      ...prev,
      claims: newClaims,
    }));
  };

  const handleUpdateConflicts = (newConflicts: Conflict[]) => {
    setProjectState((prev) => ({
      ...prev,
      conflicts: newConflicts,
    }));
  };

  const handleUpdateGaps = (newGaps: GapQuestion[]) => {
    setProjectState((prev) => ({
      ...prev,
      gaps: newGaps,
    }));
  };

  // Approve handover -> creates immutable version
  const handleApproveHandover = (reviewerName: string) => {
    const nextVersionNum = projectState.versions.length + 1;
    const newVersion: HandoverVersion = {
      versionNumber: nextVersionNum,
      versionLabel: `Official Sign-Off v${nextVersionNum}.0`,
      approvedBy: reviewerName,
      approvedAt: new Date().toISOString(),
      claims: projectState.claims,
      gaps: projectState.gaps,
      conflicts: projectState.conflicts,
    };

    const updatedState: ProjectState = {
      ...projectState,
      versions: [...projectState.versions, newVersion],
      currentDraftStatus: 'approved',
    };

    setProjectState(updatedState);
    handleLogAudit(
      'APPROVE_HANDOVER',
      `Continuation plan version v${nextVersionNum}.0 approved by ${reviewerName}`
    );
  };

  // Acknowledge handover by incoming member
  const handleAcknowledge = (recipientName: string) => {
    if (projectState.versions.length === 0) return;

    const updatedVersions = projectState.versions.map((ver, idx) => {
      if (idx === projectState.versions.length - 1) {
        return {
          ...ver,
          acknowledgedBy: recipientName,
          acknowledgedAt: new Date().toISOString(),
        };
      }
      return ver;
    });

    setProjectState((prev) => ({
      ...prev,
      versions: updatedVersions,
    }));

    handleLogAudit(
      'ACKNOWLEDGE_RECEIPT',
      `Handover continuation plan acknowledged by incoming member ${recipientName}`
    );
  };

  // Open evidence inspector drawer
  const handleOpenEvidence = (citation: Citation, chunk: Chunk | null) => {
    setSelectedCitation(citation);
    setSelectedChunk(chunk);
    handleLogAudit('INSPECT_CITATION', `Inspected evidence for chunk ${citation.chunkId}`);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header with Role Switcher & Stepper */}
      <Header
        activeRole={activeRole}
        onRoleChange={(role) => {
          setActiveRole(role);
          handleLogAudit('SWITCH_ROLE', `Active role switched to ${role}`);
        }}
        currentStep={currentStep}
        onStepChange={(step) => setCurrentStep(step)}
        onResetDemo={handleResetDemo}
        onOpenAuditLog={() => setIsAuditModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        totalRedactions={totalRedactions}
        auditCount={projectState.auditLog.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentStep === 1 && (
          <ConnectView
            sources={projectState.sources}
            activeRole={activeRole}
            projectName={projectState.projectName}
            projectDescription={projectState.projectDescription}
            onUpdateProjectInfo={(name, description) => {
              setProjectState((prev) => ({
                ...prev,
                projectName: name,
                projectDescription: description,
              }));
            }}
            onUpdateSources={handleUpdateSources}
            onLoadDemoProject={handleLoadDemoProject}
            onProceedToReconstruct={() => setCurrentStep(2)}
            onLogAudit={handleLogAudit}
          />
        )}

        {currentStep === 2 && (
          <ReconstructView
            sources={projectState.sources}
            activeRole={activeRole}
            projectName={projectState.projectName}
            claims={projectState.claims}
            conflicts={projectState.conflicts}
            gaps={projectState.gaps}
            onReconstructionComplete={handleReconstructionComplete}
            onProceedToVerify={() => setCurrentStep(3)}
            onLogAudit={handleLogAudit}
          />
        )}

        {currentStep === 3 && (
          <VerifyView
            claims={projectState.claims}
            conflicts={projectState.conflicts}
            chunksMap={chunksMap}
            activeRole={activeRole}
            onOpenEvidence={handleOpenEvidence}
            onProceedToReview={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && (
          <ReviewView
            claims={projectState.claims}
            conflicts={projectState.conflicts}
            gaps={projectState.gaps}
            activeRole={activeRole}
            chunksMap={chunksMap}
            onUpdateClaims={handleUpdateClaims}
            onUpdateConflicts={handleUpdateConflicts}
            onUpdateGaps={handleUpdateGaps}
            onApproveHandover={handleApproveHandover}
            onOpenEvidence={handleOpenEvidence}
            onProceedToHandover={() => setCurrentStep(5)}
            isHandoverApproved={isHandoverApproved}
            onLogAudit={handleLogAudit}
          />
        )}

        {currentStep === 5 && (
          <HandoverView
            projectState={projectState}
            activeRole={activeRole}
            chunksMap={chunksMap}
            onAcknowledge={handleAcknowledge}
            onOpenEvidence={handleOpenEvidence}
            onLogAudit={handleLogAudit}
          />
        )}
      </main>

      {/* Evidence Inspector Side Drawer */}
      <EvidenceDrawer
        citation={selectedCitation}
        chunk={selectedChunk}
        onClose={() => setSelectedCitation(null)}
      />

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditLog={projectState.auditLog}
      />

      {/* About & Trust Principles Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 font-serif">HandoverIQ</span>
            <span className="text-slate-400">•</span>
            <span>Evidence-Linked, Permission-Aware Knowledge Handover</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="hover:text-slate-800 underline cursor-pointer"
            >
              Trust Architecture & Disclosures
            </button>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="hover:text-slate-800 underline cursor-pointer"
            >
              Audit Trail ({projectState.auditLog.length})
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
