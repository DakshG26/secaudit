import React, { useState, useEffect } from 'react';
import { Network, Cpu, Lock, ChevronRight, Zap } from 'lucide-react';
import { AttackChain, AccessMatrixRow } from '../types/security';

interface InteractiveFeaturesProps {
  chains: AttackChain[];
  matrix: AccessMatrixRow[];
  onSelectTab: (tab: 'flows' | 'findings' | 'matrix' | 'endpoints') => void;
}

export const InteractiveFeatures: React.FC<InteractiveFeaturesProps> = ({ chains, onSelectTab }) => {
  const [chainStack, setChainStack] = useState(chains);
  useEffect(() => { setChainStack(chains); }, [chains]);

  const handleShuffle = () => {
    if (chainStack.length < 2) return;
    setChainStack((prev) => {
      const next = [...prev];
      const first = next.shift()!;
      next.push(first);
      return next;
    });
  };

  const [animStatusIdx, setAnimStatusIdx] = useState(0);
  const statuses = [
    { text: 'Harvesting AST endpoints...', tone: 'cyan' },
    { text: 'Evaluating 21 OWASP rules...', tone: 'amber' },
    { text: 'Synthesizing attack flows...', tone: 'red' },
    { text: 'Zero-trust matrix verified', tone: 'emerald' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setAnimStatusIdx((i) => (i + 1) % statuses.length), 2600);
    return () => clearInterval(timer);
  }, [statuses.length]);

  const curStatus = statuses[animStatusIdx];

  return (
    <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">Autonomous Intelligence</span>
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight mt-2">
          Engineered for <span className="font-serif italic text-cyan-300">Absolute Defense</span>
        </h2>
        <p className="text-slate-400 text-sm mt-3">
          Interactive modules demonstrating live AST extraction, exploit pathway correlation, and policy enforcement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Attack Chain Shuffler */}
        <div className="p-6 rounded-3xl bg-[#0c1322] border border-cyan-500/20 hover:border-cyan-500/40 transition flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Network className="w-4 h-4" /> Multi-Step Exploit Flow
              </span>
              <button onClick={handleShuffle} className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition cursor-pointer">
                Shuffle ↻
              </button>
            </div>
            <h3 className="font-display font-bold text-lg text-white">Chained Vulnerability Pathways</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">Isolated flaws synthesized into elevated critical takeover vectors.</p>
            {chainStack.length > 0 ? (
              <div className="space-y-2">
                {chainStack.slice(0, 3).map((c, idx) => (
                  <div key={c.id} style={{ transform: `scale(${1 - idx * 0.04})`, opacity: 1 - idx * 0.25 }} className="p-3.5 rounded-xl bg-slate-900/90 border border-red-500/30 transition-all cursor-pointer hover:border-red-400" onClick={() => onSelectTab('flows')}>
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-red-400 font-bold">{c.id}</span>
                      <span className="text-red-300 uppercase bg-red-950/60 px-1.5 py-0.5 rounded">{c.severity}</span>
                    </div>
                    <p className="text-xs font-semibold text-white line-clamp-1">{c.name}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{c.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center text-xs text-emerald-300">
                Zero attack chains discovered in target.
              </div>
            )}
          </div>
          <button onClick={() => onSelectTab('flows')} className="mt-6 inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition">
            <span>Inspect All Attack Flows</span> <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Signature Animation */}
        <div className="p-6 rounded-3xl bg-[#0c1322] border border-cyan-500/20 hover:border-cyan-500/40 transition flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Cpu className="w-4 h-4" /> Live Engine Monitor
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                21 Rules Active
              </span>
            </div>
            <h3 className="font-display font-bold text-lg text-white">AST Signature Scanner</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Deterministic AST tree walking without executing untrusted payload bytes.
            </p>

            <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#070c18] p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-mono text-slate-300 uppercase">RACK-01 // CORE AST</span>
                </div>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>

              <div className="relative flex-1 overflow-hidden my-2 flex items-center justify-around font-mono text-[10px] text-cyan-400/80">
                <div className="flex flex-col items-center animate-pulse">
                  <span>&lt;route&gt;</span>
                  <span className="text-[8px] text-slate-500">AST_FUNC</span>
                </div>
                <div className="flex flex-col items-center animate-pulse" style={{ animationDelay: '0.5s' }}>
                  <span>@login_req</span>
                  <span className="text-[8px] text-emerald-400">AUTH_PASS</span>
                </div>
                <div className="flex flex-col items-center animate-pulse" style={{ animationDelay: '1s' }}>
                  <span>eval()</span>
                  <span className="text-[8px] text-red-400">FLAW_CAUGHT</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${curStatus.tone === 'emerald' ? 'bg-emerald-400' : curStatus.tone === 'red' ? 'bg-red-400' : 'bg-cyan-400'}`} />
                  <span className="text-slate-300">{curStatus.text}</span>
                </div>
                <span className="text-slate-500">SANDBOX</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-mono text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero bytecode execution</span>
          </div>
        </div>

        {/* Card 3: Zero-Trust Matrix Preview */}
        <div className="p-6 rounded-3xl bg-[#0c1322] border border-cyan-500/20 hover:border-cyan-500/40 transition flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Lock className="w-4 h-4" /> Zero-Trust Policy
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300">
                policy.yml
              </span>
            </div>
            <h3 className="font-display font-bold text-lg text-white">Route vs. Declared Auth</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Automated Route $\times$ Expected $\times$ Actual authorization audit.
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-red-500/30 flex items-center justify-between">
                <div>
                  <span className="text-slate-200 font-bold">/admin/exec</span>
                  <p className="text-[10px] text-slate-400">Expected: admin • Actual: none</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-bold">
                  VIOLATION
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-slate-200 font-bold">/api/v1/auth</span>
                  <p className="text-[10px] text-slate-400">Expected: public • Actual: public</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  OK
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('matrix')}
            className="mt-6 inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition"
          >
            <span>Open Access Matrix Table</span> <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
