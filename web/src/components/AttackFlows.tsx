import React from 'react';
import { AttackChain, Finding } from '../types/security';
import { Network, ArrowRight, AlertOctagon, CheckCircle } from 'lucide-react';

interface AttackFlowsProps { chains: AttackChain[]; findings: Finding[]; }

export const AttackFlows: React.FC<AttackFlowsProps> = ({ chains, findings }) => {
  const getFinding = (id: string) => findings.find(f => f.id === id);

  if (chains.length === 0) {
    return (
      <div className="py-10 text-center rounded-3xl bg-emerald-50 border-2 border-emerald-200">
        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <p className="font-display font-bold text-lg text-emerald-800">No Combined Attack Paths Found</p>
        <p className="text-sm text-emerald-700 mt-1 max-w-md mx-auto">
          No multi-step exploit chains were detected — meaning isolated issues can't be chained together.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl text-ink flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />
          Combined Attack Paths
          <span className="text-sm font-body font-normal text-muted">({chains.length} chains)</span>
        </h2>
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-50 border border-red-200 text-red-700">
          Elevated Severity
        </span>
      </div>
      <p className="text-sm text-muted">
        These show how two or more separate flaws can be combined by an attacker to cause much bigger damage.
      </p>

      <div className="space-y-4">
        {chains.map(chain => (
          <div key={chain.id} className="p-5 rounded-2xl bg-surface border-2 border-red-200 shadow-sm">
            {/* Chain header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-red-100 text-red-700 border border-red-200">{chain.id}</span>
                <h3 className="font-display font-bold text-base text-ink">{chain.name}</h3>
              </div>
              <span className="flex items-center gap-1 text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                <AlertOctagon className="w-3.5 h-3.5" /> {chain.severity.toUpperCase()}
              </span>
            </div>

            {/* Plain-language description */}
            <p className="text-sm text-ink mb-4 leading-relaxed">{chain.description}</p>

            {/* Step-by-step path */}
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 mb-3">
              <p className="text-xs font-mono uppercase tracking-wider text-red-700 mb-2">How the attack unfolds</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap">
                {chain.finding_ids.map((fid, idx) => {
                  const f = getFinding(fid);
                  return (
                    <React.Fragment key={fid}>
                      <div className="flex-1 min-w-[140px] p-2.5 rounded-lg bg-surface border border-red-200">
                        <p className="text-[10px] font-mono text-red-600 mb-0.5">Step {idx + 1}</p>
                        <p className="text-xs font-semibold text-ink line-clamp-2">{f?.title ?? fid}</p>
                        <p className="text-[10px] font-mono text-muted truncate mt-0.5">{f?.location ?? ''}</p>
                      </div>
                      {idx < chain.finding_ids.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-red-400 shrink-0 rotate-90 sm:rotate-0" />
                      )}
                    </React.Fragment>
                  );
                })}
                <ArrowRight className="w-4 h-4 text-red-600 shrink-0 rotate-90 sm:rotate-0" />
                <div className="flex-1 min-w-[140px] p-2.5 rounded-lg bg-red-600 text-white">
                  <p className="text-[10px] font-mono text-red-200 mb-0.5">Result</p>
                  <p className="text-xs font-semibold line-clamp-2">{chain.description}</p>
                </div>
              </div>
            </div>

            {/* Narrative */}
            <p className="text-xs text-muted font-mono leading-relaxed border-l-2 border-red-200 pl-3">{chain.narrative}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
