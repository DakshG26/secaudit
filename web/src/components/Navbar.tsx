import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, GitBranch } from 'lucide-react';

interface NavbarProps {
  onSelectPreset: (preset: 'vulnerable' | 'clean') => void;
  isBackendLive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectPreset, isBackendLive }) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#070b14]/80 border-b border-cyan-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-white">
                SEC<span className="text-cyan-400">AUDIT</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 rounded">
                v1.0 • OWASP 2025
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              AI-Generated Web App Defense & Flow Auditor
            </p>
          </div>
        </div>

        {/* Quick actions & status */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Preset Buttons */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-900/70 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => onSelectPreset('vulnerable')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-red-300 hover:bg-red-950/50 hover:text-red-200 transition"
              title="Load intentionally vulnerable AI app scan"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Vulnerable Demo</span>
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => onSelectPreset('clean')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-emerald-300 hover:bg-emerald-950/50 hover:text-emerald-200 transition"
              title="Load fully remediated app scan"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hardened Demo</span>
            </button>
          </div>

          {/* Engine Status */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendLive ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
              }`}
            />
            <span className="text-[11px] font-mono text-slate-300">
              {isBackendLive ? 'API LIVE' : 'OFFLINE PREVIEW'}
            </span>
          </div>

          {/* Source Link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition flex items-center gap-1 text-xs"
            aria-label="Repository"
          >
            <GitBranch className="w-4 h-4 text-cyan-400" />
          </a>
        </div>
      </div>
    </header>
  );
};
