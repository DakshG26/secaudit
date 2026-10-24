import React from 'react';
import { Shield, Lock, Terminal } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="border-t border-divider bg-surface py-12 text-sm">
    <div className="max-w-7xl mx-auto px-6 sm:px-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
              <Shield className="w-4 h-4" />
            </span>
            <span className="font-display font-bold text-ink">SecAudit</span>
          </div>
          <p className="text-muted text-xs leading-relaxed">
            Deterministic AST parser for Flask/FastAPI apps. Safe, non-destructive analysis.
            Network probes limited to <code className="font-mono bg-primary/10 px-1 rounded">127.0.0.1</code> and <code className="font-mono bg-primary/10 px-1 rounded">localhost</code>.
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span className="font-display font-semibold text-ink text-sm">OWASP Top 10:2025</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['A01 Broken Access Control','A02 Misconfiguration','A03 Supply Chain','A04 Crypto Failures','A05 Injection','A09 Logging','A10 Error Handling'].map(t => (
              <span key={t} className="px-2 py-0.5 rounded-md text-xs bg-background border border-divider text-muted">{t}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-purple-600" />
            <span className="font-display font-semibold text-ink text-sm">Credits</span>
          </div>
          <p className="text-muted text-xs leading-relaxed">
            Independent clean-room implementation. Taxonomy research referenced Vibesec (AyushkhatiDev, MIT) and Vibeward (JSiapoDEV, MIT). All engine code is original.
          </p>
        </div>
      </div>
      <div className="pt-6 border-t border-divider flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        <span>© 2026 SecAudit — Authorized Security Auditing Only</span>
        <div className="flex items-center gap-4 font-mono">
          <span className="text-primary">AST Analysis</span>
          <span>•</span>
          <span className="text-emerald-600">Zero-Trust Matrix</span>
          <span>•</span>
          <span className="text-red-600">Attack Chains</span>
        </div>
      </div>
    </div>
  </footer>
);
