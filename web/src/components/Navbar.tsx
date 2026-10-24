import React, { useState, useEffect } from 'react';
import { Shield, ArrowUpRight, Menu, X, AlertTriangle, CheckCircle2, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  onSelectPreset: (p: 'vulnerable' | 'clean') => void;
  isBackendLive: boolean;
  onOpenDashboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectPreset, isBackendLive, onOpenDashboard }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 rounded-full px-4 sm:px-6 py-2.5 w-[calc(100%-2rem)] max-w-5xl ${
        scrolled ? 'glass shadow-md shadow-primary/10' : 'bg-white/80 backdrop-blur-md border border-divider shadow-sm'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2.5 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6554F0] to-[#66D9F5] text-white shadow-md shadow-primary/30">
              <Shield className="h-4 w-4 fill-white/20" strokeWidth={2.4} />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base text-ink tracking-tight">
                Sec<span className="text-primary">AI</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                Auditor
              </span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-6">
            {['#scanner','#how-it-works','#coverage'].map((href) => (
              <a key={href} href={href}
                className={`text-xs font-mono uppercase tracking-wider lift-on-hover ${scrolled ? 'text-ink/60 hover:text-primary' : 'text-ink/70 hover:text-primary'} transition-colors`}>
                {href.slice(1).replace(/-/g,' ')}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {/* API Status */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono ${
              isBackendLive ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-amber-300 bg-amber-50 text-amber-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendLive ? 'bg-emerald-500 ring-pulse' : 'bg-amber-500'}`} />
              {isBackendLive ? 'Engine Live' : 'Demo Mode'}
            </div>

            {/* Quick preset toggles */}
            <div className="hidden lg:flex items-center gap-1 p-0.5 bg-surface border border-divider rounded-lg text-xs">
              <button onClick={() => onSelectPreset('vulnerable')}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-red-600 hover:bg-red-50 transition cursor-pointer">
                <AlertTriangle className="w-3 h-3" /><span>Vulnerable</span>
              </button>
              <button onClick={() => onSelectPreset('clean')}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-emerald-700 hover:bg-emerald-50 transition cursor-pointer">
                <CheckCircle2 className="w-3 h-3" /><span>Patched</span>
              </button>
            </div>

            {onOpenDashboard && (
              <button
                onClick={onOpenDashboard}
                className="magnetic-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md shadow-[#6554F0]/30 hover:scale-102 transition-all cursor-pointer"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </button>
            )}

            <a href="#scanner"
              className="magnetic-btn hidden sm:inline-flex items-center gap-1.5 bg-surface hover:bg-primary/5 text-ink border border-divider px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors">
              Scan Now <ArrowUpRight className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
            </a>

            <button onClick={() => setOpen(true)} className="md:hidden p-1.5 text-ink/70 hover:text-ink">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute top-0 left-0 right-0 bg-surface rounded-b-3xl px-6 pt-6 pb-8 shadow-2xl border-b border-divider">
            <div className="flex items-center justify-between pb-4 border-b border-divider">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
                  <Shield className="h-4 w-4" />
                </span>
                <span className="font-display font-bold text-ink">SecAI</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-ink/60 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-3 py-4">
              {['#scanner','#how-it-works','#coverage'].map((href) => (
                <a key={href} href={href} onClick={() => setOpen(false)}
                  className="text-sm font-mono text-ink/80 hover:text-primary py-1">
                  {href.slice(1).replace(/-/g,' ')}
                </a>
              ))}
            </div>
            {onOpenDashboard && (
              <button
                onClick={() => { setOpen(false); onOpenDashboard(); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-white text-xs font-semibold shadow-md mb-2 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to SecAI Dashboard</span>
              </button>
            )}
            <div className="flex gap-2 pt-2 border-t border-divider text-xs">
              <button onClick={() => { onSelectPreset('vulnerable'); setOpen(false); }}
                className="flex-1 py-2 text-center rounded-lg bg-red-50 text-red-700 font-medium">
                Vulnerable Demo
              </button>
              <button onClick={() => { onSelectPreset('clean'); setOpen(false); }}
                className="flex-1 py-2 text-center rounded-lg bg-emerald-50 text-emerald-700 font-medium">
                Clean Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
