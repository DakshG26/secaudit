import React, { useState } from 'react';
import { 
  Shield, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Layers, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Search,
  Bot
} from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) onStartScan(inputUrl.trim());
  };

  const scoreColor = scan.score >= 80 ? '#16B887' : scan.score >= 50 ? '#FFAD42' : '#F45D75';
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (scan.score / 100) * circumference;

  const metrics = [
    { label: 'Total Endpoints', value: scan.endpoints.length || 18, change: '+12%', isGood: true, icon: Layers, color: '#6554F0' },
    { label: 'High Severity', value: scan.stats.critical + scan.stats.high || 6, change: '-25%', isGood: true, icon: ShieldAlert, color: '#F45D75' },
    { label: 'Medium Severity', value: scan.stats.medium || 8, change: '+2', isGood: false, icon: AlertTriangle, color: '#FFAD42' },
    { label: 'Low Severity', value: scan.stats.low || 4, change: '-4', isGood: true, icon: ShieldCheck, color: '#16B887' },
  ];

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Hero Banner with 3D Shield */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-[#F7F8FC] to-[#F0EDFF] border border-[#E7E9F3] p-7 md:p-9 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0EDFF] text-[#6554F0] text-xs font-semibold mb-4 border border-[#6554F0]/20">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen AI Application Security
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#18213D] leading-tight">
            Secure What You Build
          </h1>
          <p className="mt-2.5 text-sm md:text-base text-[#77819D] leading-relaxed">
            AI coding agents generate fast code, but frequently leak admin routes, unparameterized queries, and missing authorization decorators. SecAI statically audits your endpoints and verifies zero-trust access control before deployment.
          </p>

          {/* Quick Input Bar */}
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#77819D]" />
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste GitHub repository (e.g. user/repo) or URL..."
                className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm bg-white border border-[#E7E9F3] rounded-xl focus:outline-none focus:border-[#6554F0] focus:ring-2 focus:ring-[#6554F0]/20 text-[#18213D] placeholder-[#77819D] shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-white text-xs md:text-sm font-semibold hover:shadow-md hover:shadow-[#6554F0]/25 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              {isLoading ? 'Scanning...' : 'Start New Scan'}
            </button>
          </form>

          {/* Presets */}
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-[#77819D]">
            <span>Try sample:</span>
            <button
              type="button"
              onClick={() => onStartScan('sample:vulnerable')}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#E7E9F3] hover:border-[#F45D75] hover:text-[#F45D75] transition-colors font-mono text-[11px]"
            >
              sample:vulnerable
            </button>
            <button
              type="button"
              onClick={() => onStartScan('sample:clean')}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#E7E9F3] hover:border-[#16B887] hover:text-[#16B887] transition-colors font-mono text-[11px]"
            >
              sample:clean
            </button>
          </div>
        </div>

        {/* 3D Glass Shield Illustration */}
        <div className="hidden lg:flex absolute right-10 top-1/2 -translate-y-1/2 items-center justify-center">
          <div className="relative w-44 h-44 rounded-3xl bg-gradient-to-br from-[#6554F0]/15 via-white/40 to-[#66D9F5]/20 backdrop-blur-md border border-white/60 p-6 flex flex-col items-center justify-center shadow-lg shadow-[#6554F0]/10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#6554F0] to-[#66D9F5] flex items-center justify-center text-white shadow-md shadow-[#6554F0]/30 animate-pulse">
              <Shield className="w-10 h-10 stroke-[2.2]" />
            </div>
            <div className="mt-3 text-center">
              <div className="text-[11px] font-mono font-bold text-[#342D8C]">OWASP TOP 10</div>
              <div className="text-[10px] text-[#77819D]">Zero-Trust Verified</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-[#E7E9F3] p-5 shadow-xs hover:border-[#6554F0]/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#77819D]">{m.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold tracking-tight text-[#18213D]">{m.value}</span>
                <span className={`inline-flex items-center text-[11px] font-semibold ${m.isGood ? 'text-[#16B887]' : 'text-[#F45D75]'}`}>
                  {m.isGood ? <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
                  {m.change}
                </span>
              </div>
              {/* Sparkline mini bar */}
              <div className="mt-3 w-full bg-[#F7F8FC] h-1.5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (m.value / 20) * 100)}%`, backgroundColor: m.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Score & AI Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Score Gauge */}
        <div className="bg-white rounded-2xl border border-[#E7E9F3] p-6 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#77819D] mb-4">Application Security Score</div>
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#F0EDFF" strokeWidth="8" fill="transparent" />
              <circle
                cx="50" cy="50" r="40"
                stroke={scoreColor}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-[#18213D]">{scan.score}</span>
              <span className="text-[11px] font-semibold text-[#77819D]">/ 100</span>
            </div>
          </div>
          <div className="mt-4 text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: `${scoreColor}15`, color: scoreColor }}>
            {scan.score >= 80 ? 'Hardened — Ready for Prod' : scan.score >= 50 ? 'Medium Risk — Review Required' : 'Critical Risk — Patch Before Deploy'}
          </div>
          <button
            onClick={() => onNavigate('report')}
            className="mt-4 text-xs font-semibold text-[#6554F0] hover:text-[#342D8C] inline-flex items-center gap-1 cursor-pointer"
          >
            View Full Audit Report <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* AI-Powered Analysis Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E7E9F3] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E9F3]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F0EDFF] text-[#6554F0] flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#18213D]">AI-Powered Vulnerability Analysis</h3>
              </div>
              <span className="text-[11px] font-mono text-[#77819D] px-2 py-0.5 bg-[#F7F8FC] rounded border border-[#E7E9F3]">
                AST + Zero-Trust Engine
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E7E9F3] text-xs leading-relaxed text-[#18213D]">
                <strong className="text-[#F45D75] font-semibold">Priority Attack Vector Detected:</strong>{' '}
                {scan.chains[0]?.name || 'Unauthenticated admin routes coupled with unparameterized SQL interpolation.'}{' '}
                <span className="text-[#77819D]">{scan.chains[0]?.narrative || 'Attackers can bypass role checks and query arbitrary database tables.'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-[#E7E9F3] bg-white">
                  <div className="text-[11px] font-medium text-[#77819D]">Key Exposed Route</div>
                  <div className="font-mono font-semibold text-[#18213D] mt-0.5">/admin (GET) — No Auth Decorators</div>
                </div>
                <div className="p-3 rounded-lg border border-[#E7E9F3] bg-white">
                  <div className="text-[11px] font-medium text-[#77819D]">Recommended Fix</div>
                  <div className="font-medium text-[#16B887] mt-0.5">Add @login_required + Parameterize SQL</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#E7E9F3] flex items-center justify-between text-xs">
            <span className="text-[#77819D]">Target: <code className="font-mono text-[#18213D]">{scan.target}</code></span>
            <button
              onClick={() => onNavigate('findings')}
              className="text-[#6554F0] font-semibold hover:underline cursor-pointer"
            >
              Explore {scan.findings.length} Findings →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
