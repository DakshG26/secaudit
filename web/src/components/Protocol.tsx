import React from 'react';
import { FileCode, ShieldAlert, Network, ArrowDown } from 'lucide-react';

export const Protocol: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: FileCode,
      title: 'AST Route & Endpoint Harvesting',
      text: 'SecAudit traverses the Python AST (Abstract Syntax Tree) without executing any target code. It maps all routes, HTTP methods, route handlers, parameter bindings, request inputs (args, form, json), and authorization decorators.',
      pill: 'STATIC AST HARVESTER',
      accent: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300',
    },
    {
      num: '02',
      icon: ShieldAlert,
      title: 'OWASP Top 10:2025 Rule Evaluation',
      text: '21 data-driven YAML security definitions are matched against target files. Includes Shannon entropy calculation for API keys/tokens, requirements.txt supply chain unpinned dependency checks, and injection sink detection.',
      pill: 'DATA-DRIVEN RULES',
      accent: 'border-amber-500/30 bg-amber-950/20 text-amber-300',
    },
    {
      num: '03',
      icon: Network,
      title: 'Attack Flow Synthesis & Policy Matrix',
      text: 'Synthesizes isolated vulnerabilities into multi-hop exploit pathways, elevating composite severity to Critical. Compares declared policy.yml requirements against actual code decorators to flag unauthorized exposure.',
      pill: 'EXPLOIT FLOW GRAPH',
      accent: 'border-red-500/30 bg-red-950/20 text-red-300',
    },
  ];

  return (
    <section id="protocol" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">Deterministic Methodology</span>
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight mt-2">
          The 3-Stage <span className="font-serif italic text-cyan-300">Audit Protocol</span>
        </h2>
        <p className="text-slate-400 text-sm mt-3">
          How SecAudit delivers complete coverage with zero runtime contamination or destructive side effects.
        </p>
      </div>

      <div className="space-y-6 max-w-4xl mx-auto">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="p-8 rounded-3xl bg-[#0c1322] border border-slate-800 hover:border-cyan-500/40 transition duration-300 shadow-xl relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-extrabold text-cyan-400/80">
                    {step.num}
                  </span>
                  <div className="h-6 w-px bg-slate-800" />
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${step.accent}`}>
                    {step.pill}
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <h3 className="font-display font-bold text-xl text-white mb-2">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.text}</p>

              {idx < steps.length - 1 && (
                <div className="mt-4 flex justify-center text-slate-700">
                  <ArrowDown className="w-4 h-4 animate-bounce" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
