import React, { useState } from 'react';
import { Lock, AlertOctagon, CheckCircle2, HelpCircle, AlertTriangle } from 'lucide-react';
import { AccessMatrixRow } from '../types/security';

interface AccessMatrixProps {
  matrix: AccessMatrixRow[];
}

export const AccessMatrix: React.FC<AccessMatrixProps> = ({ matrix }) => {
  const [filter, setFilter] = useState<'ALL' | 'VIOLATIONS' | 'UNCOVERED'>('ALL');

  const filteredRows = matrix.filter((row) => {
    if (filter === 'VIOLATIONS') return row.status === 'VIOLATION' || row.status === 'WEAKER';
    if (filter === 'UNCOVERED') return row.status === 'UNCOVERED';
    return true;
  });

  const getStatusBadge = (status: AccessMatrixRow['status']) => {
    switch (status) {
      case 'OK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> OK
          </span>
        );
      case 'VIOLATION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-950/60 text-red-300 border border-red-500/40">
            <AlertOctagon className="w-3 h-3 text-red-400" /> VIOLATION
          </span>
        );
      case 'WEAKER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> WEAKER
          </span>
        );
      case 'UNCOVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-950/60 text-purple-300 border border-purple-500/30">
            <HelpCircle className="w-3 h-3 text-purple-400" /> UNCOVERED
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            Zero-Trust Access Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compares declared security policy (<code>policy.yml</code>) against AST-extracted actual auth decorators.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded transition cursor-pointer ${
              filter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({matrix.length})
          </button>
          <button
            onClick={() => setFilter('VIOLATIONS')}
            className={`px-2.5 py-1 rounded transition cursor-pointer ${
              filter === 'VIOLATIONS' ? 'bg-red-500/20 text-red-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Violations
          </button>
          <button
            onClick={() => setFilter('UNCOVERED')}
            className={`px-2.5 py-1 rounded transition cursor-pointer ${
              filter === 'UNCOVERED' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Uncovered
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0d1629]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#070c18] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Method</th>
              <th className="py-3 px-4">Route Path</th>
              <th className="py-3 px-4">Expected Policy</th>
              <th className="py-3 px-4">Actual Auth Decorator</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-4">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-[10px]">
                    {row.method}
                  </span>
                </td>
                <td className="py-2.5 px-4 font-semibold text-slate-200">{row.path}</td>
                <td className="py-2.5 px-4 text-cyan-300">{row.expected}</td>
                <td className="py-2.5 px-4 text-slate-300">
                  {row.auth_decorators.length > 0 ? (
                    <span className="text-emerald-400">{row.auth_decorators.join(', ')}</span>
                  ) : (
                    <span className="text-red-400/80 italic">{row.actual || 'none'}</span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-right">{getStatusBadge(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
