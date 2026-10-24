import React, { useState } from 'react';
import { Shield, ArrowUpRight, Sparkles, Layers, AlertTriangle, ShieldAlert, ShieldCheck, Search, Bot } from 'lucide-react';
import { ScanResult } from '../../types/security';

interface HomeDashboardProps {
  scan: ScanResult;
  onStartScan: (target: string) => void;
  onNavigate: (screen: 'scan' | 'findings' | 'endpoints' | 'report' | 'remediation') => void;
  isLoading: boolean;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  scan,
  onStartScan,
  onNavigate,
  isLoading
}) => {
  const [inputUrl, setInputUrl] = useState('');

  const safeFindings = scan?.findings || [];
  const safeEndpoints = scan?.endpoints || [];
  const stats = scan?.stats || { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
  const score = scan?.score ?? 100;
  const target = scan?.target || 'None';
  const topFinding = safeFindings[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim() && !isLoading) {
      onStartScan(inputUrl.trim());
      setInputUrl('');
    }
  };

  const scoreColor = score >= 80 ? '#16B887' : score >= 50 ? '#FFAD42' : '#F45D75';
  const circ = 2 * Math.PI * 40;
  const offset = circ - (score / 100) * circ;

  const metrics = [
    { label: 'Total Endpoints', value: safeEndpoints.length, detail: `${safeEndpoints.filter(e => e.is_protected).length} protected`, max: Math.max(1, safeEndpoints.length), icon: Layers, color: '#6554F0', screen: 'endpoints' as const },
    { label: 'High Severity', value: stats.critical + stats.high, detail: `${stats.critical} critical, ${stats.high} high`, max: Math.max(1, stats.total), icon: ShieldAlert, color: '#F45D75', screen: 'findings' as const },
    { label: 'Medium Severity', value: stats.medium, detail: 'Action required', max: Math.max(1, stats.total), icon: AlertTriangle, color: '#FFAD42', screen: 'findings' as const },
    { label: 'Low Severity', value: stats.low, detail: 'Hardening notices', max: Math.max(1, stats.total), icon: ShieldCheck, color: '#16B887', screen: 'findings' as const },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-[#F7F8FC] to-[#F0EDFF] border border-[#E7E9F3] p-6 md:p-7 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0EDFF] text-[#6554F0] text-xs font-semibold mb-2.5 border border-[#6554F0]/20">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Application Security
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18213D]">Secure What You Build</h1>
          <p className="mt-1.5 text-xs md:text-sm text-[#77819D] leading-relaxed">
            AI agents generate fast code, but frequently leak admin routes, unparameterized queries, and missing authorization decorators. SecAI statically audits your endpoints and verifies zero-trust access control.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77819D]" />
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste website (google.com) or GitHub repo (bottlepy/bottle)..."
                className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-white border border-[#E7E9F3] rounded-xl focus:outline-none focus:border-[#6554F0] text-[#18213D] shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !inputUrl.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-white text-xs md:text-sm font-semibold hover:shadow-md transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              {isLoading ? 'Scanning...' : 'Start New Scan'}
            </button>
          </form>

          <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-[#77819D]">
            <span>Try sample:</span>
            {[
              { label: 'google.com', target: 'https://google.com' },
              { label: 'example.com', target: 'https://example.com' },
              { label: 'bottlepy/bottle', target: 'bottlepy/bottle' },
              { label: 'sample:vulnerable', target: 'sample:vulnerable' },
            ].map(p => (
              <button key={p.label} type="button" onClick={() => onStartScan(p.target)} className="px-2 py-0.5 rounded-lg bg-white border border-[#E7E9F3] hover:border-[#6554F0] hover:text-[#6554F0] font-mono text-[11px] transition-colors cursor-pointer">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden lg:flex absolute right-7 top-1/2 -translate-y-1/2 items-center justify-center">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#6554F0]/15 via-white/50 to-[#66D9F5]/20 backdrop-blur-md border border-white/60 p-3 flex flex-col items-center justify-center shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6554F0] to-[#66D9F5] flex items-center justify-center text-white shadow-md animate-pulse">
              <Shield className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div className="mt-1 text-center">
              <div className="text-[10px] font-mono font-bold text-[#342D8C]">OWASP TOP 10</div>
              <div className="text-[9px] text-[#77819D]">Zero-Trust Verified</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              onClick={() => onNavigate(m.screen)}
              className="bg-white rounded-xl border border-[#E7E9F3] p-3.5 shadow-xs hover:border-[#6554F0]/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#77819D] group-hover:text-[#6554F0] transition-colors">{m.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-2xl font-bold tracking-tight text-[#18213D]">{m.value}</span>
                <span className="text-right text-[10px] text-[#77819D]">{m.detail}</span>
              </div>
              <div className="mt-2 w-full bg-[#F7F8FC] h-1.5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (m.value / m.max) * 100)}%`, backgroundColor: m.color }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-[#E7E9F3] p-4 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#77819D] mb-2.5">Security Score</div>
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#F0EDFF" strokeWidth="8" fill="transparent" />
              <circle cx="50" cy="50" r="40" stroke={scoreColor} strokeWidth="8" fill="transparent" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-[#18213D]">{Math.round(score)}</span>
              <span className="text-[9px] font-semibold text-[#77819D]">/ 100</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${scoreColor}15`, color: scoreColor }}>
            {score >= 80 ? 'Hardened — Prod Ready' : score >= 50 ? 'Medium Risk — Action Required' : 'Critical Risk — Patch Before Deploy'}
          </div>
          <button onClick={() => onNavigate('report')} className="mt-2 text-xs font-semibold text-[#6554F0] hover:text-[#342D8C] inline-flex items-center gap-1 cursor-pointer">
            Full Audit Report <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E7E9F3] p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E7E9F3]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#F0EDFF] text-[#6554F0] flex items-center justify-center"><Bot className="w-3.5 h-3.5" /></div>
                <h3 className="text-xs font-bold text-[#18213D]">AI-Powered Vulnerability Analysis</h3>
              </div>
              <span className="text-[10px] font-mono text-[#77819D] px-2 py-0.5 bg-[#F7F8FC] rounded border border-[#E7E9F3]">AST + Zero-Trust</span>
            </div>
            <div className="mt-2.5 space-y-2">
              <div className="p-2.5 rounded-xl bg-[#F7F8FC] border border-[#E7E9F3] text-xs leading-relaxed text-[#18213D]">
                <strong className={safeFindings.length === 0 ? "text-[#16B887]" : "text-[#F45D75]"}>
                  {safeFindings.length === 0 ? "Zero Attack Vectors:" : "Priority Vulnerability:"}
                </strong>{' '}
                {topFinding ? topFinding.title : 'All routes authenticated and security baselines passing.'}{' '}
                <span className="text-[#77819D]">{topFinding ? topFinding.impact : 'Zero vulnerabilities found.'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg border border-[#E7E9F3] bg-white">
                  <div className="text-[10px] text-[#77819D]">Location / Target</div>
                  <div className="font-mono font-semibold text-[#18213D] truncate mt-0.5" title={topFinding?.location || target}>
                    {topFinding ? `${topFinding.location} (${topFinding.owasp})` : `All ${safeEndpoints.length} routes verified`}
                  </div>
                </div>
                <div className="p-2 rounded-lg border border-[#E7E9F3] bg-white">
                  <div className="text-[10px] text-[#77819D]">Remediation Action</div>
                  <div className={`font-semibold mt-0.5 truncate ${safeFindings.length === 0 ? 'text-[#16B887]' : 'text-[#6554F0]'}`} title={topFinding?.remediation || 'Maintain current policy'}>
                    {topFinding ? topFinding.remediation : 'Zero-trust controls active'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E7E9F3] flex items-center justify-between text-xs">
            <span className="text-[#77819D] truncate">Target: <code className="font-mono text-[#18213D]">{target}</code></span>
            <button onClick={() => onNavigate('findings')} className="text-[#6554F0] font-semibold hover:underline cursor-pointer">
              Explore {safeFindings.length} Findings →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
