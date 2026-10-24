import React, { useState, useEffect } from 'react';
import { Shield, ArrowUpRight, Menu, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  onSelectPreset: (p: 'vulnerable' | 'clean') => void;
  isBackendLive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectPreset, isBackendLive }) => {
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
        scrolled ? 'glass shadow-md shadow-primary/10' : 'bg-white/70 backdrop-blur-md border border-divider'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2.5 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/30">
              <Shield className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <span className="font-display font-bold text-base text-ink tracking-tight">
              Sec<span className="text-primary">Audit</span>
            </span>
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

            <a href="#scanner"
              className="magnetic-btn inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg shadow-primary/25 transition-colors">
              Scan Now <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
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
          <div className="absolute top-0 left-0 right-0 bg-surface rounded-b-4xl px-6 pt-8 pb-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <span className="font-display font-bold text-xl text-ink">SecAudit</span>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-full bg-divider/60 text-ink/70"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex flex-col gap-1 mb-8">
              {[['#scanner','Scanner'],['#how-it-works','How It Works'],['#coverage','OWASP Coverage']].map(([h,l]) => (
                <a key={h} href={h} onClick={() => setOpen(false)}
                  className="font-display text-2xl font-semibold text-ink py-3 border-b border-divider">{l}</a>
              ))}
            </div>
            <div className="space-y-2">
              <button onClick={() => { onSelectPreset('vulnerable'); setOpen(false); }}
                className="w-full py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                Load Vulnerable App Demo
              </button>
              <button onClick={() => { onSelectPreset('clean'); setOpen(false); }}
                className="w-full py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                Load Patched App Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
