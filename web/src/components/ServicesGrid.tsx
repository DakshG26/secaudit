import React from 'react';
import { Lock, Settings, Package, Key, Terminal, AlertCircle } from 'lucide-react';

export const ServicesGrid: React.FC = () => {
  const services = [
    {
      icon: Lock,
      title: 'A01: Broken Access Control & IDOR',
      owasp: 'OWASP A01:2025',
      cwe: 'CWE-862, CWE-639',
      text: 'Identifies unprotected administrative endpoints, IDOR parameter queries without ownership validation, and commented-out authorization decorators.',
    },
    {
      icon: Settings,
      title: 'A02: Security Misconfiguration',
      owasp: 'OWASP A02:2025',
      cwe: 'CWE-215, CWE-489',
      text: 'Detects debug=True left enabled in Flask/FastAPI run calls, exposed environment files, default credentials, and permissive CORS headers.',
    },
    {
      icon: Package,
      title: 'A03: Software Supply Chain Failures',
      owasp: 'OWASP A03:2025',
      cwe: 'CWE-1104',
      text: 'Parses requirements.txt for unpinned packages, vulnerable package dependencies, and optional live PyPI hallucination verification.',
    },
    {
      icon: Key,
      title: 'A04: Cryptographic Failures & Secrets',
      owasp: 'OWASP A04:2025',
      cwe: 'CWE-798, CWE-328',
      text: 'Scans for hardcoded tokens using Shannon entropy scoring, MD5/SHA1 hashing for passwords, and weak or "none" JWT signing configurations.',
    },
    {
      icon: Terminal,
      title: 'A05: Code & SQL Injection Sinks',
      owasp: 'OWASP A05:2025',
      cwe: 'CWE-89, CWE-94, CWE-78',
      text: 'Detects SQL queries built via string formatting or f-strings, dangerous runtime sinks like eval(), exec(), os.system(), and missing request validation.',
    },
    {
      icon: AlertCircle,
      title: 'A09/A10: Logging & Exception Handling',
      owasp: 'OWASP A09/A10:2025',
      cwe: 'CWE-778, CWE-209',
      text: 'Flags silent failed authentication flows without security audit logs and unhandled exceptions that leak stack traces directly to clients.',
    },
  ];

  return (
    <section id="services" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">Comprehensive Taxonomy</span>
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight mt-2">
          OWASP Top 10:2025 <span className="font-serif italic text-cyan-300">Coverage Matrix</span>
        </h2>
        <p className="text-slate-400 text-sm mt-3">
          Every rule maps directly to modern OWASP classifications and standard CWE identifiers.
        </p>
      </div>

      {/* Dark grid with gap-px dividers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-800/80 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        {services.map((svc) => {
          const Icon = svc.icon;
          return (
            <div
              key={svc.title}
              className="p-8 bg-[#0a101f] hover:bg-[#0e1629] transition duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {svc.owasp}
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-white mb-2">{svc.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{svc.text}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{svc.cwe}</span>
                <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition duration-300">
                  SecAudit Core →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
