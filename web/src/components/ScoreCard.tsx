import React from 'react';
import { ScanResult } from '../types/security';
import { ShieldCheck, ShieldAlert, AlertTriangle, Clock, ExternalLink } from 'lucide-react';

interface ScoreCardProps { scan: ScanResult; }

export const ScoreCard: React.FC<ScoreCardProps> = ({ scan }) => {
  const { score, status, stats, target, scan_time } = scan;

  const statusConfig = {
    clean: { label: 'No Issues Found', color: 'emerald', icon: ShieldCheck, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', ring: 'text-emerald-500' },
    warning: { label: 'Some Issues', color: 'amber', icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', ring: 'text-amber-500' },
    compromised: { label: 'Serious Issues', color: 'red', icon: ShieldAlert, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', ring: 'text-red-500' },
  }[status] ?? { label: 'Scanned', color: 'primary', icon: ShieldCheck, bg: 'bg-primary/5', border: 'border-primary/20', text: 'text-primary', ring: 'text-primary' };

  const Icon = statusConfig.icon;

  const scoreColor = score >= 90 ? 'stroke-emerald-500' : score >= 60 ? 'stroke-amber-400' : 'stroke-red-500';
  const trackLen = 2 * Math.PI * 38; // r=38

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className={`p-6 rounded-3xl border-2 ${statusConfig.border} ${statusConfig.bg} flex flex-col sm:flex-row items-center gap-6`}>
        {/* Score gauge */}
        <div className="relative flex-shrink-0 w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="38" fill="none" strokeWidth="8" stroke="#E0E0E0" />
            <circle cx="48" cy="48" r="38" fill="none" strokeWidth="8"
              className={scoreColor}
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * trackLen} ${trackLen}`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold font-display text-ink">{score}</span>
            <span className="text-[9px] font-mono uppercase text-muted">/ 100</span>
          </div>
        </div>

        {/* Status */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <Icon className={`w-5 h-5 ${statusConfig.ring}`} strokeWidth={2.2} />
            <span className={`font-display font-bold text-xl ${statusConfig.text}`}>{statusConfig.label}</span>
          </div>
          <p className="text-sm text-muted mb-2 flex items-center gap-1 justify-center sm:justify-start">
            <span className="font-mono truncate max-w-xs">{target}</span>
            {target.startsWith('http') && <ExternalLink className="w-3 h-3 shrink-0" />}
          </p>
          <p className="text-xs text-muted font-mono flex items-center gap-1 justify-center sm:justify-start">
            <Clock className="w-3 h-3" /> Scanned {new Date(scan_time).toLocaleTimeString()}
          </p>
        </div>

        {/* Counts */}
        <div className="grid grid-cols-4 gap-2 shrink-0">
          {[
            { label: 'Critical', count: stats.critical, color: 'bg-red-100 text-red-700 border-red-200' },
            { label: 'High',     count: stats.high,     color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { label: 'Medium',   count: stats.medium,   color: 'bg-amber-100 text-amber-700 border-amber-200' },
            { label: 'Low',      count: stats.low,      color: 'bg-blue-100 text-blue-700 border-blue-200' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`px-3 py-2 rounded-xl border text-center ${color}`}>
              <div className="text-xl font-bold font-display">{count}</div>
              <div className="text-[10px] font-mono uppercase">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
