import React from 'react';
import { Shield, Lock, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-slate-900 bg-[#050811] text-xs font-mono text-slate-500 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Engine Spec */}
          <div>
            <div className="flex items-center gap-2 text-slate-300 font-bold mb-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>SecAudit Core Engine</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Deterministic AST parser for Flask/FastAPI architectures. Safe static auditing with no code execution.
              All network probes strictly isolated to <code>127.0.0.1</code>, <code>localhost</code>, and <code>::1</code>.
            </p>
          </div>

          {/* OWASP Coverage */}
          <div>
            <div className="flex items-center gap-2 text-slate-300 font-bold mb-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>OWASP Top 10:2025 Coverage</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              {['A01: Broken Access Control', 'A02: Security Misconfig', 'A03: Supply Chain', 'A04: Cryptographic Failures', 'A05: Injection', 'A09: Logging & Alerting', 'A10: Exceptional Conditions'].map((item) => (
                <span key={item} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Academic & Reference Note */}
          <div>
            <div className="flex items-center gap-2 text-slate-300 font-bold mb-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Independent Implementation</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Clean-room architecture. Reference studies on Vibesec (AyushkhatiDev, MIT) and Vibeward (JSiapoDEV, MIT) cited for taxonomy research. All SecAudit engine code is novel.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <span>© 2026 SecAudit Research. Authorized Security Auditor.</span>
          <div className="flex items-center gap-4">
            <span className="text-cyan-400">AST Route Extraction</span>
            <span>•</span>
            <span className="text-emerald-400">Policy Matrix</span>
            <span>•</span>
            <span className="text-red-400">Attack Chains</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
