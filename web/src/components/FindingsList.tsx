import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, ShieldAlert } from 'lucide-react';
import { Finding, Severity } from '../types/security';

interface FindingsListProps {
  findings: Finding[];
}

export const FindingsList: React.FC<FindingsListProps> = ({ findings }) => {
  const [selectedSev, setSelectedSev] = useState<Severity | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = findings.filter((f) => (selectedSev === 'all' ? true : f.severity === selectedSev));

  const getSevBadge = (sev: Severity) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'low':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            Security Findings ({findings.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            OWASP Top 10:2025 verified static vulnerabilities with actionable code remedies.
          </p>
        </div>

        {/* Severity pill buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSev(sev)}
              className={`px-2.5 py-1 rounded capitalize transition cursor-pointer ${
                selectedSev === sev ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Cards list */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-[#0d1629] overflow-hidden transition hover:border-slate-700"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30 transition select-none"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getSevBadge(item.severity)}`}>
                      {item.severity}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                      {item.owasp}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.cwe}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      [{item.confidence}]
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{item.location}</p>
                </div>

                <div className="text-slate-400">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3 text-xs bg-[#090f1d]">
                  {/* Evidence */}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Code Evidence
                    </span>
                    <pre className="p-2.5 rounded bg-[#050811] border border-slate-800 text-red-300 font-mono text-xs overflow-x-auto">
                      {item.evidence}
                    </pre>
                  </div>

                  {/* Impact & Remediation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-2.5 rounded bg-slate-900/40 border border-slate-800">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block mb-1">
                        Impact
                      </span>
                      <p className="text-slate-300 leading-relaxed">{item.impact}</p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900/40 border border-slate-800">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-1">
                        Remediation
                      </span>
                      <p className="text-slate-300 leading-relaxed">{item.remediation}</p>
                    </div>
                  </div>

                  {/* Fixed Code example */}
                  {item.fixed_code && (
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block mb-1 flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5" /> Recommended Fix
                      </span>
                      <pre className="p-2.5 rounded bg-[#050811] border border-emerald-900/40 text-emerald-300 font-mono text-xs overflow-x-auto">
                        {item.fixed_code}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
