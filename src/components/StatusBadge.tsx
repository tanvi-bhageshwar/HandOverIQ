import React from 'react';
import { ClaimStatus } from '../types';
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ClaimStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-medium',
  };

  switch (status) {
    case 'verified':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 ${sizeClasses[size]}`}
          title="Verified in code: quote found verbatim in cited chunk"
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
          <span>Verified</span>
        </span>
      );

    case 'partial':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 ${sizeClasses[size]}`}
          title="Partial evidence: weak match or single unconfirmed chat mention"
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
          <span>Partial</span>
        </span>
      );

    case 'conflicting':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 ${sizeClasses[size]}`}
          title="Conflicting evidence: sources contradict each other"
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
          <span>Conflicting</span>
        </span>
      );

    case 'unverified':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${sizeClasses[size]}`}
          title="No evidence found in cited chunk"
        >
          {showIcon && <HelpCircle className="w-3.5 h-3.5 text-slate-500" />}
          <span>Unverified</span>
        </span>
      );
  }
};
