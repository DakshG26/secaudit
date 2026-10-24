import React from 'react';
import { Lock, Settings, Package, Key, Terminal, AlertCircle } from 'lucide-react';

export const ServicesGrid: React.FC = () => {
  const services = [
    { icon: Lock,        owasp: 'A01', title: 'Broken Access Control', desc: 'Finds routes missing login checks, IDOR parameter access without ownership validation, and admin routes wide open to anyone.' },
    { icon: Settings,    owasp: 'A02', title: 'Security Misconfiguration', desc: 'Catches debug=True left on, wildcard CORS headers, missing security headers on live endpoints, and exposed config files.' },
    { icon: Package,     owasp: 'A03', title: 'Vulnerable Dependencies', desc: 'Checks requirements.txt for unpinned packages and optionally verifies packages against PyPI to catch hallucinated dependencies.' },
    { icon: Key,         owasp: 'A04', title: 'Hardcoded Secrets & Weak Crypto', desc: 'Finds API keys and passwords in code using Shannon entropy scoring, MD5/SHA1 password hashing, and weak JWT configurations.' },
    { icon: Terminal,    owasp: 'A05', title: 'Code & SQL Injection', desc: 'Detects SQL built via f-strings or formatting, dangerous eval()/exec()/os.system() calls, and missing validation on user inputs.' },
    { icon: AlertCircle, owasp: 'A09/10', title: 'Logging & Error Handling', desc: 'Flags failed logins with no audit log, and exceptions that return full stack traces back to the browser — revealing server internals.' },
  ];

  return (
    <section id="coverage" className="py-24 bg-deep">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-primary-light">What we check</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight mt-2">
            OWASP Top 10:2025 <span className="font-serif italic text-primary-light">Coverage</span>
          </h2>
          <p className="text-white/50 text-sm mt-3">Every finding maps to a real OWASP category and CWE identifier.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/10">
          {services.map(svc => {
            const Icon = svc.icon;
            return (
              <div key={svc.owasp} className="p-7 bg-deep hover:bg-white/5 transition-colors group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="p-3 rounded-2xl bg-primary/15 border border-primary/25 text-primary-light group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" strokeWidth={2.2} />
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 border border-white/15 text-white/50">
                      OWASP {svc.owasp}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-white mb-2">{svc.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{svc.desc}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-white/10">
                  <span className="text-xs font-mono text-primary-light opacity-0 group-hover:opacity-100 transition-opacity">
                    SecAudit checks this →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
