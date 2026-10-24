import React, { useState } from 'react';
import { Finding, Severity } from '../types/security';
import { ChevronDown, ChevronUp, Code2, ShieldAlert } from 'lucide-react';

interface FindingsListProps { findings: Finding[]; }

const SEVERITY_CONFIG: Record<Severity | 'info', { label: string; bg: string; text: string; border: string; dot: string }> = {
  critical: { label: 'Critical',  bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500' },
  high:     { label: 'High',      bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  medium:   { label: 'Medium',    bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400' },
  low:      { label: 'Low',       bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400' },
  info:     { label: 'Info',      bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200',   dot: 'bg-gray-400' },
};

const CONFIDENCE_LABEL: Record<string, { label: string; color: string }> = {
  confirmed: { label: '✓ Confirmed', color: 'text-red-600 font-semibold' },
  likely:    { label: '~ Likely',    color: 'text-amber-600' },
  possible:  { label: '? Possible',  color: 'text-muted' },
};

export const FindingsList: React.FC<FindingsListProps> = ({ findings }) => {
  const [sel, setSel] = useState<Severity | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState<boolean>(false);

  const filtered = sel === 'all' ? findings : findings.filter(f => f.severity === sel);

  if (findings.length === 0) {
    return (
      <div className="py-12 text-center text-muted">
        <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-divider" />
        <p className="text-base font-medium">No findings for this target.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-ink flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            Security Issues Found
            <span className="text-sm font-body font-normal text-muted">({findings.length} total)</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">Click any card to reveal exact code evidence and recommended fix.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAllExpanded(!allExpanded)}
            className="px-2.5 py-1 text-xs font-mono text-primary bg-primary/10 hover:bg-primary/20 border border-primary/25 rounded-lg transition cursor-pointer"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
          <div className="flex items-center gap-1 p-1 bg-surface border border-divider rounded-xl text-xs font-mono">
            {(['all','critical','high','medium','low'] as const).map(s => (
              <button key={s} onClick={() => setSel(s)}
                className={`px-2.5 py-1 rounded-lg capitalize transition cursor-pointer ${
                  sel === s ? 'bg-primary text-white font-semibold' : 'text-muted hover:text-ink'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Finding cards */}
      <div className="space-y-3">
        {filtered.map(f => {
          const cfg = SEVERITY_CONFIG[f.severity] ?? SEVERITY_CONFIG.info;
          const conf = CONFIDENCE_LABEL[f.confidence] ?? { label: f.confidence, color: 'text-muted' };
          const open = allExpanded || expanded === f.id;
          return (
            <div key={f.id} className={`rounded-2xl border-2 ${cfg.border} overflow-hidden bg-surface shadow-sm hover:shadow-md transition-shadow`}>
              {/* Header row */}
              <button
                onClick={() => setExpanded(open ? (allExpanded ? f.id : null) : f.id)}
                className="w-full text-left p-4 flex items-start gap-3 cursor-pointer hover:bg-divider/20 transition-colors"
              >
                <span className={`mt-1 w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0 ring-2 ring-offset-2 ring-offset-surface ${cfg.dot.replace('bg-','ring-')}/30`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold uppercase ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                      {cfg.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-primary/10 text-primary border border-primary/20">
                      {f.owasp}
                    </span>
                    <span className="text-xs font-mono text-muted">{f.cwe}</span>
                    <span className={`text-xs font-mono ${conf.color}`}>{conf.label}</span>
                  </div>
                  <p className="font-display font-semibold text-base text-ink">{f.title}</p>
                  <p className="text-xs text-muted mt-0.5 line-clamp-1">{f.impact}</p>
                  <p className="text-[11px] font-mono text-primary/80 mt-1 truncate">📍 {f.location}</p>
                </div>
                <div className="text-muted shrink-0 mt-0.5">
                  {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded detail */}
              {open && (
                <div className="px-4 pb-4 pt-0 space-y-3 animate-fade-in border-t border-divider bg-background">
                  <div className="pt-3">
                    <p className="text-xs font-mono uppercase tracking-wider text-muted mb-1.5">Exact Code Line Found</p>
                    <pre className={`p-3 rounded-xl ${cfg.bg} border ${cfg.border} text-xs font-mono text-ink overflow-x-auto whitespace-pre-wrap`}>{f.evidence}</pre>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-xs font-mono uppercase tracking-wider text-amber-700 font-bold mb-1">Why this is dangerous</p>
                      <p className="text-xs text-ink leading-relaxed">{f.impact}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold mb-1">How to fix it</p>
                      <p className="text-xs text-ink leading-relaxed">{f.remediation}</p>
                    </div>
                  </div>

                  {f.fixed_code && (
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-emerald-700 mb-1.5 flex items-center gap-1 font-bold">
                        <Code2 className="w-3.5 h-3.5" /> Recommended Fix
                      </p>
                      <pre className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-900 overflow-x-auto whitespace-pre">{f.fixed_code}</pre>
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
