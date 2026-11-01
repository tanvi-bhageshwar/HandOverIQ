import React from 'react';
import { AuditLogEntry } from '../types';
import { FileSpreadsheet, X, Download, ShieldCheck } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLog: AuditLogEntry[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, auditLog }) => {
  if (!isOpen) return null;

  const handleExportCSV = () => {
    let csv = 'Timestamp,Role,Actor,Action,Details\n';
    for (const item of auditLog) {
      const cleanDetails = item.details.replace(/"/g, '""');
      csv += `"${item.timestamp}","${item.role}","${item.actor}","${item.action}","${cleanDetails}"\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HandoverIQ_AuditLog_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Immutable Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Complete cryptographically traceable log of views, edits, approvals, and acknowledgements.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
          {auditLog.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">No audit events recorded yet.</p>
          ) : (
            auditLog.map((entry) => (
              <div key={entry.id} className="py-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                  <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  <span className="uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {entry.role}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{entry.actor}:</span>
                  <span className="font-mono text-indigo-700 font-semibold">{entry.action}</span>
                </div>
                <p className="text-slate-600 pl-2 border-l-2 border-slate-200">{entry.details}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit entries stored locally with timestamp integrity</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
