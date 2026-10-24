import React from 'react';
import { Network, ArrowRight, Flame, CheckCircle } from 'lucide-react';
import { AttackChain, Finding } from '../types/security';

interface AttackFlowsProps {
  chains: AttackChain[];
  findings: Finding[];
}

export const AttackFlows: React.FC<AttackFlowsProps> = ({ chains, findings }) => {
  const getFinding = (id: string) => findings.find((f) => f.id === id);

  if (chains.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No Multi-Step Attack Flows Detected</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          No correlated vulnerability sequences (e.g., exposed admin + code injection) were discovered.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            Correlated Attack Flows ({chains.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            SecAudit chains low/medium isolated findings into high-impact full compromise pathways.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-950/70 border border-red-500/40 text-red-300">
          ELEVATED SEVERITY
        </span>
      </div>

      <div className="space-y-4">
        {chains.map((chain) => (
          <div
            key={chain.id}
            className="p-5 rounded-xl bg-[#0d1629] border border-cyan-500/30 hover:border-cyan-400/60 transition shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                  {chain.id}
                </span>
                <h3 className="font-bold text-white text-base">{chain.name}</h3>
              </div>
              <span className="flex items-center gap-1 text-xs font-mono font-bold uppercase text-red-400 bg-red-950/60 px-2.5 py-1 rounded-md border border-red-800">
                <Flame className="w-3.5 h-3.5" />
                {chain.severity} CHAIN
              </span>
            </div>

            {/* Flow Steps Diagram */}
            <div className="my-4 p-4 rounded-lg bg-[#070c18] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">
                Exploitation Pathway
              </span>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {chain.finding_ids.map((fid, idx) => {
                  const finding = getFinding(fid);
                  return (
                    <React.Fragment key={fid}>
                      <div className="w-full sm:flex-1 p-3 rounded-lg bg-slate-900/90 border border-slate-700/80">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-cyan-400">Step {idx + 1}</span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {finding?.owasp || 'VULN'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-white line-clamp-1">
                          {finding?.title || fid}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                          {finding?.location || 'Endpoint'}
                        </p>
                      </div>

                      {idx < chain.finding_ids.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 rotate-90 sm:rotate-0" />
                      )}
                    </React.Fragment>
                  );
                })}

                <ArrowRight className="w-4 h-4 text-red-400 shrink-0 rotate-90 sm:rotate-0" />

                {/* Final Impact Node */}
                <div className="w-full sm:flex-1 p-3 rounded-lg bg-red-950/30 border border-red-500/40">
                  <span className="text-[10px] font-mono text-red-400 font-bold block mb-1">
                    CRITICAL OUTCOME
                  </span>
                  <p className="text-xs font-semibold text-red-200 line-clamp-2">
                    {chain.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Narrative */}
            <div className="mt-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed">
              <span className="text-cyan-400 font-bold">Attack Narrative: </span>
              {chain.narrative}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
