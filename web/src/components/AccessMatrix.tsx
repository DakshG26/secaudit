import React, { useState } from 'react';
import { AccessMatrixRow } from '../types/security';
import { Lock, CheckCircle2, AlertOctagon, AlertTriangle, HelpCircle } from 'lucide-react';

interface AccessMatrixProps { matrix: AccessMatrixRow[]; }

const STATUS_CONFIG = {
  OK:        { label: 'OK — secure',        icon: CheckCircle2,  text: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200', desc: 'Auth matches the policy' },
  VIOLATION: { label: 'Violation — open!',  icon: AlertOctagon,  text: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200',     desc: 'This route has no auth but should' },
  WEAKER:    { label: 'Weaker than policy', icon: AlertTriangle, text: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',   desc: 'Auth exists but weaker than required' },
  UNCOVERED: { label: 'Not in policy',      icon: HelpCircle,    text: 'text-purple-700',  bg: 'bg-purple-50',   border: 'border-purple-200',  desc: 'No policy rule covers this route' },
};

export const AccessMatrix: React.FC<AccessMatrixProps> = ({ matrix }) => {
  const [filter, setFilter] = useState<'ALL' | 'VIOLATION' | 'UNCOVERED'>('ALL');

  const shown = matrix.filter(r =>
    filter === 'ALL' ? true : filter === 'VIOLATION' ? (r.status === 'VIOLATION' || r.status === 'WEAKER') : r.status === 'UNCOVERED'
  );

  const violations = matrix.filter(r => r.status === 'VIOLATION' || r.status === 'WEAKER').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-ink flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" /> Access Control Check
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Compares what auth your <code className="font-mono text-xs bg-primary/10 px-1 rounded">policy.yml</code> requires vs. what your code actually enforces.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-surface border border-divider rounded-xl text-xs font-mono">
          <button onClick={() => setFilter('ALL')} className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filter === 'ALL' ? 'bg-primary text-white font-semibold' : 'text-muted hover:text-ink'}`}>
            All ({matrix.length})
          </button>
          <button onClick={() => setFilter('VIOLATION')} className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filter === 'VIOLATION' ? 'bg-red-500 text-white font-semibold' : 'text-muted hover:text-ink'}`}>
            Violations ({violations})
          </button>
          <button onClick={() => setFilter('UNCOVERED')} className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filter === 'UNCOVERED' ? 'bg-purple-500 text-white font-semibold' : 'text-muted hover:text-ink'}`}>
            Uncovered
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border-2 border-divider bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-divider text-xs font-mono uppercase tracking-wider text-muted">
            <tr>
              <th className="py-3 px-4 text-left">Method</th>
              <th className="py-3 px-4 text-left">Route</th>
              <th className="py-3 px-4 text-left">Required Auth</th>
              <th className="py-3 px-4 text-left">Actual Code Auth</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {shown.map((row, i) => {
              const cfg = STATUS_CONFIG[row.status];
              const Icon = cfg.icon;
              return (
                <tr key={i} className="hover:bg-background/60 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                      {row.method}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-sm font-semibold text-ink">{row.path}</td>
                  <td className="py-2.5 px-4 font-mono text-xs text-primary">{row.expected}</td>
                  <td className="py-2.5 px-4 font-mono text-xs">
                    {row.auth_decorators.length > 0
                      ? <span className="text-emerald-700">{row.auth_decorators.join(', ')}</span>
                      : <span className="text-red-600 italic">{row.actual || 'none'}</span>}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <Icon className="w-3 h-3" strokeWidth={2.2} /> {cfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
