import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, GitBranch, Search, Loader2, FolderCode, Sparkles, Globe, AlertTriangle } from 'lucide-react';

interface HeroProps {
  onScan: (url: string) => void;
  isLoading: boolean;
  isBackendLive: boolean;
  errorMsg?: string | null;
}

export const Hero: React.FC<HeroProps> = ({ onScan, isLoading, isBackendLive, errorMsg }) => {
  const [input, setInput] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-eyebrow', { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 });
      gsap.from('.hero-h1', { y: 32, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.25 });
      gsap.from('.hero-sub', { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.45 });
      gsap.from('.hero-form', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.6 });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) onScan(input.trim());
  };

  const quickScan = (val: string) => { setInput(val); onScan(val); };

  return (
    <section ref={heroRef} className="relative min-h-[88dvh] flex flex-col justify-center pt-28 pb-16 overflow-hidden">
      {/* Subtle grid + ambient blob */}
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 text-center">
        {/* Eyebrow */}
        <span className="hero-eyebrow inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono uppercase tracking-[0.18em]">
          <GitBranch className="w-3.5 h-3.5" />
          AST-Based Security Scanner — OWASP 2025
        </span>

        {/* Headline */}
        <h1 className="hero-h1 font-display font-extrabold tracking-tight leading-[1.0]">
          <span className="block text-4xl sm:text-6xl lg:text-7xl text-ink">Find security holes</span>
          <span className="block font-serif italic font-semibold text-primary text-5xl sm:text-7xl lg:text-8xl mt-2" style={{ lineHeight: '0.95' }}>
            before attackers do.
          </span>
        </h1>

        {/* Subtext */}
        <p className="hero-sub mt-6 text-muted text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Paste a public GitHub repository URL. SecAudit reads the source code (never runs it),
          finds real vulnerabilities, and explains each problem in plain language with a clear fix.
        </p>

        {/* Scan form */}
        <div className="hero-form mt-8 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex flex-col sm:flex-row gap-2 p-2 bg-surface border-2 border-primary/30 rounded-2xl shadow-xl shadow-primary/10 focus-within:border-primary transition-colors">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-4 h-4 text-muted shrink-0" />
                <input
                  type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Website URL (google.com) or GitHub repo (org/repo)..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm text-ink placeholder-muted/70 focus:outline-none font-mono py-2"
                />
              </div>
              <button type="submit" disabled={isLoading || !input.trim()}
                className="magnetic-btn flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-colors shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Scanning…</span></>
                           : <><span>Scan Repo</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </form>

          {/* Preset chips */}
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
            <span className="text-muted font-mono self-center">Try:</span>
            <button onClick={() => quickScan('sample:vulnerable')} disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition cursor-pointer">
              <FolderCode className="w-3.5 h-3.5" /> Vulnerable Flask App (12 planted flaws)
            </button>
            <button onClick={() => quickScan('sample:clean')} disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer">
              <Sparkles className="w-3.5 h-3.5" /> Patched Version (0 findings)
            </button>
            {isBackendLive && (
              <button onClick={() => quickScan('https://github.com/bottlepy/bottle')} disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition cursor-pointer">
                <Globe className="w-3.5 h-3.5" /> Live: bottlepy/bottle
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs sm:text-sm text-left flex items-start gap-3 shadow-md animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">Scan Notice</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary font-mono text-center animate-pulse">
              Reading source code via AST — never executing target code…
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
