import React, { useState, useEffect } from 'react';
import { Network, Cpu, Lock, ChevronRight, Zap } from 'lucide-react';
import { AttackChain } from '../types/security';

interface InteractiveFeaturesProps {
  chains: AttackChain[];
  onSelectTab: (tab: 'flows' | 'findings' | 'matrix' | 'endpoints') => void;
}

export const InteractiveFeatures: React.FC<InteractiveFeaturesProps> = ({ chains, onSelectTab }) => {
  const [stack, setStack] = useState(chains);
  useEffect(() => setStack(chains), [chains]);

  const shuffle = () => {
    if (stack.length < 2) return;
    setStack(prev => { const n = [...prev]; n.push(n.shift()!); return n; });
  };

  const [statusIdx, setStatusIdx] = useState(0);
  const statuses = [
    { text: 'Parsing AST tree…', dot: 'bg-primary' },
    { text: 'Matching 21 OWASP rules…', dot: 'bg-amber-500' },
    { text: 'Building attack chains…', dot: 'bg-red-500' },
    { text: 'Policy matrix verified ✓', dot: 'bg-emerald-500' },
  ];
  useEffect(() => {
    const t = setInterval(() => setStatusIdx(i => (i + 1) % statuses.length), 2400);
    return () => clearInterval(t);
  }, [statuses.length]);

  const cur = statuses[statusIdx];

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
              <button onClick={shuffle} className="text-[10px] font-mono text-muted hover:text-primary border border-divider px-2 py-0.5 rounded-lg transition cursor-pointer">
                Next ↻
              </button>
            </div>
            <h3 className="font-display font-bold text-base text-ink mb-1">Chained Vulnerability Paths</h3>
            <p className="text-xs text-muted mb-4">Small flaws combined into big exploits.</p>
            {stack.length > 0 ? (
              <div className="space-y-2">
                {stack.slice(0, 3).map((c, i) => (
                  <div key={c.id} style={{ transform: `scale(${1 - i * 0.03})`, opacity: 1 - i * 0.25 }}
                    onClick={() => onSelectTab('flows')}
                    className="p-3 rounded-xl border-2 border-red-100 bg-red-50 cursor-pointer hover:border-red-200 transition-colors">
                    <div className="flex justify-between text-[10px] font-mono mb-0.5">
                      <span className="text-red-700 font-bold">{c.id}</span>
                      <span className="text-red-600 uppercase">{c.severity}</span>
                    </div>
                    <p className="text-xs font-semibold text-ink line-clamp-1">{c.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-700">
                No attack chains found in this scan.
              </div>
            )}
            <button onClick={() => onSelectTab('flows')} className="mt-5 text-xs font-mono text-primary hover:text-primary-dark flex items-center gap-1 lift-on-hover">
              View all chains <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Engine monitor */}
          <div className="p-6 rounded-3xl bg-background border-2 border-divider hover:border-primary/40 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Cpu className="w-4 h-4" /> Engine Monitor
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">21 rules</span>
            </div>
            <h3 className="font-display font-bold text-base text-ink mb-1">AST Code Scanner</h3>
            <p className="text-xs text-muted mb-4">Zero code execution. Pure read-only.</p>

            <div className="relative h-36 rounded-2xl border-2 border-divider bg-surface p-3 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between border-b border-divider pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-muted uppercase">AST Core Running</span>
                </div>
                <div className="flex gap-1">
                  {['bg-red-400','bg-amber-400','bg-emerald-400'].map(c => <span key={c} className={`w-2 h-2 rounded-full ${c}`} />)}
                </div>
              </div>
              <div className="flex items-center justify-around py-2 font-mono text-[10px]">
                <div className="text-center"><p className="text-primary animate-pulse">&lt;route&gt;</p><p className="text-muted">AST node</p></div>
                <div className="text-center" style={{ animationDelay: '0.5s' }}><p className="text-emerald-600 animate-pulse">@login</p><p className="text-muted">auth OK</p></div>
                <div className="text-center" style={{ animationDelay: '1s' }}><p className="text-red-600 animate-pulse">eval()</p><p className="text-muted">flagged!</p></div>
              </div>
              <div className="flex items-center gap-2 border-t border-divider pt-2 text-[10px] font-mono">
                <span className={`w-2 h-2 rounded-full ${cur.dot}`} />
                <span className="text-muted">{cur.text}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs font-mono text-muted">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> No code is ever executed
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

            <button onClick={() => onSelectTab('matrix')} className="mt-5 text-xs font-mono text-primary hover:text-primary-dark flex items-center gap-1 lift-on-hover">
              View full matrix <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
