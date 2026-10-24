import React from 'react';
import { ShieldAlert, ShieldCheck, Clock, Target } from 'lucide-react';
import { ScanResult } from '../types/security';

interface ScoreCardProps {
  scan: ScanResult;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ scan }) => {
  const { score, status, stats, target, scan_time } = scan;

  const getStatusColor = () => {
    if (status === 'clean') return { text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/30' };
    if (status === 'warning') return { text: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-950/30' };
    return { text: 'text-red-400', border: 'border-red-500/40', bg: 'bg-red-950/30' };
  };

  const statusTheme = getStatusColor();

  return (
    <div className="w-full max-w-5xl mx-auto mb-8 p-6 rounded-2xl bg-[#0b1325]/90 border border-slate-800 backdrop-blur-md shadow-xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Score & Gauge */}
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-slate-800 bg-[#070b14]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}
                strokeDasharray={`${score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold font-mono text-white">{score}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Score</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${statusTheme.border} ${statusTheme.bg} ${statusTheme.text}`}>
                {status.toUpperCase()}
              </span>
              {status === 'clean' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate max-w-xs">{target}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <Clock className="w-3 h-3" />
              <span>{new Date(scan_time).toLocaleTimeString()} UTC</span>
            </div>
          </div>
        </div>

        {/* Severity Metrics Grid */}
        <div className="grid grid-cols-4 gap-3 w-full md:w-auto">
          <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-center min-w-[70px]">
            <span className="block text-xl font-bold font-mono text-red-400">{stats.critical}</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-red-300/70">Critical</span>
          </div>
          <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-900/40 text-center min-w-[70px]">
            <span className="block text-xl font-bold font-mono text-orange-400">{stats.high}</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-orange-300/70">High</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-center min-w-[70px]">
            <span className="block text-xl font-bold font-mono text-amber-400">{stats.medium}</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300/70">Medium</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40 text-center min-w-[70px]">
            <span className="block text-xl font-bold font-mono text-blue-400">{stats.low}</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-blue-300/70">Low</span>
          </div>
        </div>
      </div>
    </div>
  );
};
