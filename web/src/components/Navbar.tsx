import React, { useState, useEffect } from 'react';
import { Shield, ArrowUpRight, Menu, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  onSelectPreset: (preset: 'vulnerable' | 'clean') => void;
  isBackendLive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectPreset, isBackendLive }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 rounded-full px-4 sm:px-6 py-2.5 w-[calc(100%-2rem)] max-w-5xl ${
          scrolled ? 'glass-dark shadow-2xl shadow-cyan-950/40 border border-cyan-500/30' : 'bg-[#070b14]/70 backdrop-blur-md border border-slate-800/80'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Brand */}
          <a href="#" className="flex items-center gap-2.5 group">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Shield className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="font-display font-extrabold tracking-tight text-white text-base">
              SEC<span className="text-primary-light">AUDIT</span>
            </span>
          </a>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#audit" className="text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-cyan-400 transition lift-on-hover">Audit</a>
            <a href="#flows" className="text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-cyan-400 transition lift-on-hover">Flows</a>
            <a href="#features" className="text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-cyan-400 transition lift-on-hover">Features</a>
            <a href="#protocol" className="text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-cyan-400 transition lift-on-hover">Protocol</a>
            <a href="#services" className="text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-cyan-400 transition lift-on-hover">OWASP 2025</a>
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-400 ring-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300">{isBackendLive ? 'API LIVE' : 'PREVIEW'}</span>
            </div>

            {/* Quick Demo toggles */}
            <div className="hidden lg:flex items-center gap-1 p-0.5 bg-slate-900/80 border border-slate-800 rounded-lg text-[11px]">
              <button
                onClick={() => onSelectPreset('vulnerable')}
                className="px-2 py-0.5 rounded text-red-300 hover:bg-red-950/60 transition cursor-pointer flex items-center gap-1"
                title="Simulate Vulnerable Demo App"
              >
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span>Demo</span>
              </button>
              <button
                onClick={() => onSelectPreset('clean')}
                className="px-2 py-0.5 rounded text-emerald-300 hover:bg-emerald-950/60 transition cursor-pointer flex items-center gap-1"
                title="Simulate Patched Demo App"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Clean</span>
              </button>
            </div>

            {/* CTA */}
            <a
              href="#audit"
              className="magnetic-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-cyan-500/25"
            >
              <span>Scan Repo</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </a>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-slate-300 hover:text-white"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md md:hidden flex flex-col justify-between p-6">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-white text-lg">SecAudit AI</span>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-col gap-4 font-mono text-lg text-slate-200">
            <a href="#audit" onClick={() => setMobileMenuOpen(false)}>Audit Workbench</a>
            <a href="#flows" onClick={() => setMobileMenuOpen(false)}>Attack Flows</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Interactive Features</a>
            <a href="#protocol" onClick={() => setMobileMenuOpen(false)}>AST Protocol</a>
            <a href="#services" onClick={() => setMobileMenuOpen(false)}>OWASP 2025 Pillars</a>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => { onSelectPreset('vulnerable'); setMobileMenuOpen(false); }}
              className="w-full py-2.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-mono"
            >
              Load Vulnerable App Demo
            </button>
            <button
              onClick={() => { onSelectPreset('clean'); setMobileMenuOpen(false); }}
              className="w-full py-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono"
            >
              Load Patched App Demo
            </button>
          </div>
        </div>
      )}
    </>
  );
};
