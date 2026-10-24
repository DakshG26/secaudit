import React from 'react';
import { ShieldCheck, Cpu, GitBranch, Lock, Network } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-8 pb-4 text-center">
      {/* Glow Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-64 bg-cyan-500/10 blur-[90px] pointer-events-none rounded-full" />

      {/* Security pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
        <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
        <span>AST-DRIVEN STATIC ROUTE & FLOW AUDITOR</span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
        Expose Vulnerabilities &{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
          Attack Flows
        </span>{' '}
        in AI Web Apps
      </h1>

      {/* Subtitle */}
      <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
        Analyze GitHub repositories or live endpoints without executing untrusted code.
        Maps findings to <span className="text-cyan-300 font-medium">OWASP Top 10:2025</span>, correlates 
        multi-step exploit chains, and computes zero-trust route access matrices.
      </p>

      {/* Feature Badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Non-Destructive AST Analysis</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          <span>Multi-Finding Attack Chains</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Policy vs. Actual Access Matrix</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <GitBranch className="w-3.5 h-3.5 text-purple-400" />
          <span>Before / After Diff Verification</span>
        </div>
      </div>
    </section>
  );
};
