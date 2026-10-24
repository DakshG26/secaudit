import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, GitBranch, Terminal } from 'lucide-react';

interface HeroProps {
  onScan: (url: string) => void;
  isLoading: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onScan, isLoading }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [inputVal, setInputVal] = React.useState('');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-badge', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 });
      gsap.from('.hero-line-1', { y: 35, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.25 });
      gsap.from('.hero-line-2', { y: 45, opacity: 0, duration: 1.1, ease: 'power3.out', delay: 0.4 });
      gsap.from('.hero-meta', { y: 25, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.6 });
      gsap.from('.hero-intake', { y: 25, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.75 });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) onScan(inputVal.trim());
  };

  return (
    <section ref={heroRef} className="relative min-h-[90dvh] flex flex-col justify-center pt-24 pb-16 overflow-hidden">
      {/* Grid and Ambient Glow */}
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-40" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-[15%] h-2 w-2 rounded-full bg-cyan-400/50 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[60%] right-[8%] h-1.5 w-1.5 rounded-full bg-emerald-400/40 animate-float" style={{ animationDelay: '1.8s' }} />
        <div className="absolute top-[45%] left-[12%] h-2 w-2 rounded-full bg-blue-500/40 animate-float" style={{ animationDelay: '3.2s' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow badge */}
        <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>AUTONOMOUS AST AUDITOR & ATTACK FLOW CORRELATOR</span>
        </div>

        {/* Display Typography */}
        <h1 className="font-display font-extrabold text-white leading-[1.0] tracking-tight">
          <span className="hero-line-1 block text-4xl sm:text-6xl lg:text-7xl">
            Vulnerabilities Uncovered.
          </span>
          <span
            className="hero-line-2 block font-serif italic font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-5xl sm:text-7xl lg:text-8xl mt-3"
            style={{ lineHeight: '0.95' }}
          >
            Every attack path mapped.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-meta mx-auto max-w-2xl text-slate-400 text-sm sm:text-base lg:text-lg mt-6 leading-relaxed">
          Paste any public GitHub repository or target endpoint. SecAudit inspects application routes via Python's AST,
          evaluates 21 data-driven OWASP Top 10:2025 rules, and synthesizes multi-stage exploit chains without executing target code.
        </p>

        {/* Hero Quick Intake */}
        <div className="hero-intake mt-8 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/30 to-blue-600/30 blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className="relative flex flex-col sm:flex-row items-stretch gap-2 p-2 bg-[#0c1322] border border-cyan-500/40 rounded-2xl shadow-2xl">
              <div className="relative flex-1 flex items-center pl-3">
                <GitBranch className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="https://github.com/org/repo or click preset below"
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono py-2"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="magnetic-btn flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/30 cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Scanning AST...' : 'Audit Target'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Quick preset chips */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
            <span className="text-slate-500">Live Samples:</span>
            <button
              onClick={() => { setInputVal('sample:vulnerable'); onScan('sample:vulnerable'); }}
              className="px-2.5 py-1 rounded-md bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/50 transition cursor-pointer"
            >
              🔥 Vulnerable AI App (12 Flaws)
            </button>
            <button
              onClick={() => { setInputVal('sample:clean'); onScan('sample:clean'); }}
              className="px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 transition cursor-pointer"
            >
              🛡️ Patched App (0 Flaws)
            </button>
            <button
              onClick={() => { setInputVal('https://github.com/bottlepy/bottle'); onScan('https://github.com/bottlepy/bottle'); }}
              className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700 text-slate-300 hover:border-cyan-500/50 transition cursor-pointer"
            >
              📦 Real GitHub (bottle)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
