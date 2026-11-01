import React, { useState } from 'react';
import { Source, UserRole, AccessLevel, SourceType } from '../types';
import { chunkContent } from '../services/redact';
import { hasClearance } from '../services/permissions';
import {
  Upload,
  FileCode,
  FileText,
  MessageSquare,
  Shield,
  Plus,
  ArrowRight,
  Database,
  Lock,
  Eye,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface ConnectViewProps {
  sources: Source[];
  activeRole: UserRole;
  projectName: string;
  projectDescription: string;
  onUpdateProjectInfo: (name: string, description: string) => void;
  onUpdateSources: (sources: Source[]) => void;
  onLoadDemoProject: () => void;
  onProceedToReconstruct: () => void;
  onLogAudit: (action: string, details: string) => void;
}

export const ConnectView: React.FC<ConnectViewProps> = ({
  sources,
  activeRole,
  projectName,
  projectDescription,
  onUpdateProjectInfo,
  onUpdateSources,
  onLoadDemoProject,
  onProceedToReconstruct,
  onLogAudit,
}) => {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedName, setEditedName] = useState(projectName);
  const [editedDesc, setEditedDesc] = useState(projectDescription);
  const [selectedSourceForView, setSelectedSourceForView] = useState<Source | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceType, setNewSourceType] = useState<SourceType>('notes');
  const [newSourceAccess, setNewSourceAccess] = useState<AccessLevel>('team');
  const [newSourceContent, setNewSourceContent] = useState('');

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        let detectedType: SourceType = 'doc';
        if (file.name.endsWith('.csv')) detectedType = 'tasks';
        else if (file.name.includes('chat') || file.name.includes('slack')) detectedType = 'chat';
        else if (file.name.includes('meeting') || file.name.includes('notes')) detectedType = 'notes';
        else if (file.name.includes('readme') || file.name.endsWith('.ts') || file.name.endsWith('.js'))
          detectedType = 'repo';

        const sourceId = `src-${file.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const chunks = chunkContent(sourceId, file.name, text, 'team', 10);

        const newSource: Source = {
          id: sourceId,
          name: file.name,
          type: detectedType,
          accessLevel: 'team',
          content: text,
          chunks,
          redactions: [],
          createdAt: new Date().toISOString(),
        };

        const updated = [...sources, newSource];
        onUpdateSources(updated);
        onLogAudit('UPLOAD_FILE_SOURCE', `Uploaded ${file.name} (${chunks.length} chunks)`);
      };
      reader.readAsText(file);
    });
  };

  const handleCreateCustomSource = () => {
    if (!newSourceName.trim() || !newSourceContent.trim()) return;

    const sourceId = `src-${newSourceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const chunks = chunkContent(sourceId, newSourceName, newSourceContent, newSourceAccess, 10);

    const newSource: Source = {
      id: sourceId,
      name: newSourceName,
      type: newSourceType,
      accessLevel: newSourceAccess,
      content: newSourceContent,
      chunks,
      redactions: [],
      createdAt: new Date().toISOString(),
    };

    onUpdateSources([...sources, newSource]);
    onLogAudit('ADD_CUSTOM_SOURCE', `Created source "${newSourceName}" with ${newSourceAccess} access`);
    setShowAddModal(false);
    setNewSourceName('');
    setNewSourceContent('');
  };

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'repo':
        return <FileCode className="w-5 h-5 text-blue-600" />;
      case 'tasks':
        return <Database className="w-5 h-5 text-indigo-600" />;
      case 'notes':
        return <FileText className="w-5 h-5 text-emerald-600" />;
      case 'chat':
        return <MessageSquare className="w-5 h-5 text-amber-600" />;
      case 'doc':
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  const totalChunks = sources.reduce((acc, s) => acc + s.chunks.length, 0);
  const authorizedChunks = sources.reduce(
    (acc, s) => acc + (hasClearance(activeRole, s.accessLevel) ? s.chunks.length : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Banner / Instructions */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
            <span>Step 1: Authorized Source Ingestion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif">
            Connect Authorised Knowledge Sources
          </h1>
          <p className="text-indigo-200 text-sm leading-relaxed">
            When team members depart, crucial tribal knowledge remains locked in repos, sprint boards,
            decision notes, and incident chats. Load our synthetic demo project or upload your own files to
            reconstruct verified ground truth.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onLoadDemoProject}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4 text-slate-900" />
              <span>Load Demo Project (TechFest 2026)</span>
            </button>

            <label className="px-4 py-2.5 rounded-xl font-medium text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload Files (.md, .txt, .csv, .json)</span>
              <input
                type="file"
                multiple
                accept=".md,.txt,.csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl font-medium text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Project Profile Bar */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        {isEditingInfo ? (
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Project Name"
                className="px-2.5 py-1 text-xs font-bold text-slate-900 border rounded-lg border-indigo-400 focus:outline-indigo-600 flex-1"
              />
              <button
                onClick={() => {
                  onUpdateProjectInfo(editedName, editedDesc);
                  setIsEditingInfo(false);
                  onLogAudit('UPDATE_PROJECT_INFO', `Renamed project to "${editedName}"`);
                }}
                className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditedName(projectName);
                  setEditedDesc(projectDescription);
                  setIsEditingInfo(false);
                }}
                className="px-2 py-1 text-slate-500 text-xs hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
            <input
              type="text"
              value={editedDesc}
              onChange={(e) => setEditedDesc(e.target.value)}
              placeholder="Brief project description"
              className="w-full px-2.5 py-1 text-xs text-slate-600 border rounded-lg border-slate-300 focus:outline-indigo-600"
            />
          </div>
        ) : (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 font-serif">{projectName}</span>
              <button
                onClick={() => setIsEditingInfo(true)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 underline font-medium cursor-pointer"
              >
                Edit Details
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{projectDescription}</p>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time Ingestion Live</span>
          </span>
        </div>
      </div>

      {/* Permission & Redaction Guarantees Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/60 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              Pre-AI Permission Gate
            </h4>
            <p className="text-xs text-indigo-800/80 mt-1">
              Currently, your active role is <strong className="capitalize">{activeRole}</strong>. Out of {totalChunks} chunks, only <strong>{authorizedChunks} authorized chunks</strong> can be sent to Gemini.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/60 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-600 text-white shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Automated Secrets Redaction
            </h4>
            <p className="text-xs text-amber-800/80 mt-1">
              API keys (rzp_*, AIza*, ghp_*), emails, phone numbers, and [CONFIDENTIAL] lines are masked in memory before storage or analysis.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/60 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Deterministic Chunk IDs
            </h4>
            <p className="text-xs text-emerald-800/80 mt-1">
              Uniform 10-line spans (S1-C1, S1-C2) allow 100% reproducible verbatim quote verification in code without trusting AI hallucinations.
            </p>
          </div>
        </div>
      </div>

      {/* Authorized Sources Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Authorised Knowledge Sources ({sources.length})</h2>
            <p className="text-xs text-slate-500">
              Review connected repositories, sprint exports, chat channels, and operational records.
            </p>
          </div>
          <button
            onClick={onProceedToReconstruct}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            <span>Proceed to Reconstruct</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((src) => {
            const isAccessible = hasClearance(activeRole, src.accessLevel);
            return (
              <div
                key={src.id}
                className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                  isAccessible
                    ? 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
                    : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100">{getSourceIcon(src.type)}</div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug break-words">
                          {src.name}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400 uppercase">
                          Type: {src.type}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        src.accessLevel === 'admin-only'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : src.accessLevel === 'lead-only'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {src.accessLevel}
                    </span>
                  </div>

                  {/* Content snippet */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 font-mono text-xs text-slate-600 max-h-24 overflow-hidden text-ellipsis line-clamp-3">
                    {src.chunks[0]?.text || src.content.slice(0, 150)}
                  </div>

                  {/* Redactions Pill */}
                  {src.redactions && src.redactions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {src.redactions.map((r, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium"
                        >
                          Redacted: {r.type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono">{src.chunks.length} Chunks</span>
                  <div className="flex items-center gap-2">
                    {isAccessible ? (
                      <button
                        onClick={() => setSelectedSourceForView(src)}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Chunks</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 italic">
                        <Lock className="w-3 h-3" />
                        <span>Requires {src.accessLevel}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source Inspector Modal */}
      {selectedSourceForView && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedSourceForView.name}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedSourceForView.chunks.length} Chunks | Access: {selectedSourceForView.accessLevel}
                </p>
              </div>
              <button
                onClick={() => setSelectedSourceForView(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {selectedSourceForView.chunks.map((chk) => (
                <div key={chk.chunkId} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="font-bold text-indigo-700">{chk.chunkId}</span>
                    <span>Lines {chk.startLine} - {chk.endLine}</span>
                  </div>
                  <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {chk.text}
                  </pre>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                onClick={() => setSelectedSourceForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Custom Source</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Source Title / Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. Sprint Review Notes #4"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-slate-900 border-slate-300 focus:outline-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Source Type</label>
                  <select
                    value={newSourceType}
                    onChange={(e) => setNewSourceType(e.target.value as SourceType)}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900 border-slate-300 focus:outline-indigo-600"
                  >
                    <option value="notes">Meeting Notes</option>
                    <option value="repo">Repository / Git</option>
                    <option value="tasks">Task Board (CSV)</option>
                    <option value="chat">Chat Export</option>
                    <option value="doc">Document</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Access Level</label>
                  <select
                    value={newSourceAccess}
                    onChange={(e) => setNewSourceAccess(e.target.value as AccessLevel)}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900 border-slate-300 focus:outline-indigo-600"
                  >
                    <option value="team">Team (Level 2)</option>
                    <option value="lead-only">Lead-Only (Level 3)</option>
                    <option value="admin-only">Admin-Only (Level 4)</option>
                    <option value="public">Public (Level 1)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Content (Markdown / Plain Text)</label>
                <textarea
                  rows={6}
                  placeholder="Paste documentation, sprint logs, or notes here..."
                  value={newSourceContent}
                  onChange={(e) => setNewSourceContent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-slate-900 border-slate-300 font-mono focus:outline-indigo-600"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomSource}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm"
              >
                Save & Chunk Source
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
