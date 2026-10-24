import React, { useState, useEffect } from 'react';
import { Network, Cpu, Lock, ChevronRight, Zap } from 'lucide-react';
import { AttackChain } from '../types/security';

interface InteractiveFeaturesProps {
  chains: AttackChain[];
  onSelectTab: (tab: 'flows' | 'findings' | 'matrix' | 'endpoints') => void;
}

const ENGINE_STATUSES = [
  { text: 'Parsing AST tree…', dot: 'bg-primary' },
  { text: 'Matching 21 OWASP rules…', dot: 'bg-amber-500' },
  { text: 'Building attack chains…', dot: 'bg-red-500' },
  { text: 'Policy matrix verified ✓', dot: 'bg-emerald-500' },
] as const;

const STATUS_INTERVAL_MS = 2400;

export const InteractiveFeatures: React.FC<InteractiveFeaturesProps> = ({ chains, onSelectTab }) => {
  const [stack, setStack] = useState(chains);
  useEffect(() => setStack(chains), [chains]);

  const canShuffle = stack.length > 1;
  const hasChains = stack.length > 0;

  const shuffle = () => {
    if (!canShuffle) return;
    setStack(prev => { const n = [...prev]; n.push(n.shift()!); return n; });
  };

  const [statusIdx, setStatusIdx] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setStatusIdx((index) => (index + 1) % ENGINE_STATUSES.length);
    }, STATUS_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const cur = ENGINE_STATUSES[statusIdx] ?? ENGINE_STATUSES[0];

  return (
    <section className="py-20 bg-surface border-y border-divider">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Live Modules</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-ink tracking-tight mt-2">
            What you get from every scan
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Chain shuffler */}
          <div className="p-6 rounded-3xl bg-background border-2 border-divider hover:border-primary/40 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Network className="w-4 h-4" /> Attack Paths
              </span>
              <button
                type="button"
                onClick={shuffle}
                disabled={!canShuffle}
                aria-label={canShuffle ? 'Show the next attack path' : 'No additional attack paths available'}
                className="text-[10px] font-mono text-muted hover:text-primary border border-divider px-2 py-0.5 rounded-lg transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted"
              >
                Next ↻
              </button>
            </div>
            <h3 className="font-display font-bold text-base text-ink mb-1">Chained Vulnerability Paths</h3>
            <p className="text-xs text-muted mb-4">Small flaws combined into big exploits.</p>
            {stack.length > 0 ? (
              <div className="space-y-2">
                {stack.slice(0, 3).map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectTab('flows')}
                    aria-label={`View attack path ${c.id}: ${c.name}`}
                    style={{ transform: `scale(${1 - i * 0.03})`, opacity: 1 - i * 0.25 }}
                    className="w-full p-3 rounded-xl border-2 border-red-100 bg-red-50 text-left cursor-pointer hover:border-red-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    <div className="flex justify-between text-[10px] font-mono mb-0.5">
                      <span className="text-red-700 font-bold">{c.id}</span>
                      <span className="text-red-600 uppercase">{c.severity}</span>
                    </div>
                    <p className="text-xs font-semibold text-ink line-clamp-1">{c.name}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-700">
                No attack chains found in this scan.
              </div>
            )}
            <button
              type="button"
              onClick={() => onSelectTab('flows')}
              disabled={!hasChains}
              aria-label={hasChains ? 'View all attack chains' : 'No attack chains available'}
              className="mt-5 text-xs font-mono text-primary hover:text-primary-dark flex items-center gap-1 lift-on-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-primary"
            >
              View all chains <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Signature Cybersecurity AST Engine Monitor & Radar */}
          <div className="p-6 rounded-3xl bg-background border-2 border-divider hover:border-primary/40 transition-colors shadow-sm relative overflow-hidden group">
            {/* Ambient cyber glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6554F0]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-mono uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#6554F0]" /> Signature Engine Monitor
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold">21 rules</span>
            </div>
            <h3 className="font-display font-bold text-base text-ink mb-1 relative z-10">AST Deep Code Scanner</h3>
            <p className="text-xs text-muted mb-4 relative z-10">Zero code execution. Pure AST static security traversal.</p>

            <div className="relative h-40 rounded-2xl border-2 border-divider bg-[#0E1326] p-3.5 flex flex-col justify-between overflow-hidden text-white shadow-inner">
              {/* Radar pulse scan line */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -left-1/2 top-0 w-[200%] h-1 bg-gradient-to-r from-transparent via-[#66D9F5] to-transparent animate-pulse opacity-75" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(101,84,240,0.15)_0,transparent_70%)] animate-ping" style={{ animationDuration: '3s' }} />
              </div>

              <div className="flex items-center justify-between border-b border-white/10 pb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#16B887] animate-ping" />
                  <span className="text-[10px] font-mono text-[#66D9F5] uppercase tracking-wider font-semibold">AST Realtime Traversal</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[9px] text-white/50">
                  <span className="text-[#6554F0] font-bold">&lt;/&gt;</span>
                  <span>AST.WALK</span>
                </div>
              </div>

              <div className="flex items-center justify-around py-2.5 font-mono text-[11px] relative z-10">
                <div className="text-center">
                  <p className="text-[#66D9F5] font-bold">&lt;route&gt;</p>
                  <p className="text-[9px] text-white/40">node parsed</p>
                </div>
                <div className="text-center">
                  <p className="text-[#16B887] font-bold">@auth</p>
                  <p className="text-[9px] text-white/40">verified</p>
                </div>
                <div className="text-center">
                  <p className="text-[#F45D75] font-bold animate-pulse">eval()</p>
                  <p className="text-[9px] text-[#F45D75]/80 font-semibold">flagged!</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px] font-mono relative z-10" role="status" aria-live="polite">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cur.dot}`} />
                  <span className="text-white/80">{cur.text}</span>
                </div>
                <span className="text-[#66D9F5] text-[9px]">ACTIVE</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-mono text-muted relative z-10">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Safe, read-only
              </span>
              <span className="text-[10px] text-primary hover:underline cursor-pointer font-semibold" onClick={() => onSelectTab('matrix')}>
                Inspect AST Rules →
              </span>
            </div>
          </div>

          {/* Card 3: Access matrix preview */}
          <div className="p-6 rounded-3xl bg-background border-2 border-divider hover:border-primary/40 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Access Control
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700">policy.yml</span>
            </div>
            <h3 className="font-display font-bold text-base text-ink mb-1">Route Auth Checker</h3>
            <p className="text-xs text-muted mb-4">Policy says vs. code says — compared row by row.</p>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 border border-red-200">
                <div><p className="font-bold text-ink">/admin/panel</p><p className="text-muted text-[10px]">policy: admin · code: none</p></div>
                <span className="px-2 py-0.5 rounded-md bg-red-100 border border-red-200 text-red-700 font-bold text-[10px]">VIOLATION</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div><p className="font-bold text-ink">/login</p><p className="text-muted text-[10px]">policy: public · code: public</p></div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[10px]">OK</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('matrix')}
              aria-label="View full access control matrix"
              className="mt-5 text-xs font-mono text-primary hover:text-primary-dark flex items-center gap-1 lift-on-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              View full matrix <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
