import React from 'react';
import { FileCode, ShieldAlert, Network, ArrowDown } from 'lucide-react';

export const Protocol: React.FC = () => {
  const steps = [
    {
      num: '01', icon: FileCode, pill: 'AST Harvester', title: 'Read source code — never run it',
      text: 'SecAudit walks your code\'s Abstract Syntax Tree (AST) to extract every route, HTTP method, function handler, URL parameters, request inputs (form, JSON, query), and authentication decorators. No code is executed.',
      accent: 'border-primary/30 bg-primary/10 text-primary',
    },
    {
      num: '02', icon: ShieldAlert, pill: '21 OWASP Rules', title: 'Match 21 security rules',
      text: 'Each line of code is checked against 21 YAML-defined rules covering injection, hardcoded secrets, weak crypto, missing auth, insecure config, and more. Shannon entropy scoring catches API keys. Dependency files are checked for unpinned packages.',
      accent: 'border-amber-300 bg-amber-50 text-amber-700',
    },
    {
      num: '03', icon: Network, pill: 'Chain Analysis', title: 'Combine issues into attack paths',
      text: 'Individually minor issues are combined into attack chains — e.g., an open admin route + SQL injection = full database dump without login. Chain severity is elevated above its individual parts.',
      accent: 'border-red-300 bg-red-50 text-red-700',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="max-w-4xl mx-auto px-6 sm:px-10">
        <div className="text-center mb-14">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-primary">How it works</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-ink tracking-tight mt-2">
            3-step audit, <span className="font-serif italic text-primary">no setup needed.</span>
          </h2>
        </div>

        <div className="space-y-5">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.num}>
                <div className="p-7 rounded-3xl bg-surface border-2 border-divider hover:border-primary/30 transition-colors shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-2xl font-extrabold text-primary/60">{s.num}</span>
                    <div className="h-5 w-px bg-divider" />
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${s.accent}`}>{s.pill}</span>
                    <div className="ml-auto p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-xl text-ink mb-1.5">{s.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{s.text}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex justify-center py-1 text-divider">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
