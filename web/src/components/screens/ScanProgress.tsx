import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  CircleDot, 
  Clock, 
  XOctagon, 
  Terminal, 
  ShieldAlert, 
  Activity,
  ArrowRight
} from 'lucide-react';

interface ScanProgressProps {
  onCancel?: () => void;
  onViewResults?: () => void;
  target?: string;
  isLiveScanning?: boolean;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({
  onCancel,
  onViewResults,
  target = 'https://github.com/demo/ai-web-vulnerable',
  isLiveScanning = false,
}) => {
  const [progress, setProgress] = useState(62);
  const logs = [
    '[*] Starting SecAI authorized audit engine v1.0...',
    '[+] Target confirmed: ' + target,
    '[+] Parsing AST syntax trees across routes...',
    '[✓] Discovered 8 route handlers (app.py)',
    '[✓] Mapped access matrix against zero-trust policy',
    '[!] Found unauthenticated handler on GET /admin',
    '[*] Evaluating OWASP Top 10:2025 rule set...',
    '[→] Testing injection vectors on GET /search...',
  ];

  useEffect(() => {
    if (isLiveScanning) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 95 ? prev + 1 : prev));
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isLiveScanning]);

  const steps = [
    { label: 'Collecting endpoints', status: 'completed' },
    { label: 'Static code analysis', status: 'completed' },
    { label: 'Checking configurations', status: 'completed' },
    { label: 'Scanning OWASP Top 10', status: 'in-progress' },
    { label: 'Generating report', status: 'pending' },
  ];

  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="rounded-2xl bg-[#0E1326] text-white p-6 md:p-8 border border-[#1E2648] shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#6554F0]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#66D9F5]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1E2648]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#66D9F5] animate-ping" />
            <span className="text-xs font-mono font-medium tracking-wide uppercase text-[#66D9F5]">
              Active Workspace
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">Running Security Scan…</h2>
          <p className="text-xs text-[#8F9CAE] mt-0.5 font-mono truncate max-w-xl">
            Target: <span className="text-[#66D9F5]">{target}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-[#151B38] hover:bg-[#1E2648] border border-[#2A3460] text-xs font-medium text-[#F45D75] hover:text-white transition-all flex items-center gap-2 cursor-pointer"
            >
              <XOctagon className="w-3.5 h-3.5" />
              Cancel Scan
            </button>
          )}
          {onViewResults && (
            <button
              onClick={onViewResults}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-xs font-semibold text-white hover:shadow-lg hover:shadow-[#6554F0]/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              View Findings <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Gauge + Checklist */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-7">
        {/* Left: Circular Progress at 62% */}
        <div className="lg:col-span-4 bg-[#151B38]/80 backdrop-blur-md rounded-xl border border-[#1E2648] p-6 flex flex-col items-center justify-center text-center">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" stroke="#1E2648" strokeWidth="8" fill="transparent" />
              <circle
                cx="50" cy="50" r="44"
                stroke="#6554F0"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-white tracking-tight">{progress}%</span>
              <span className="text-[11px] font-mono text-[#66D9F5]">In Progress</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-[#8F9CAE]">
            Estimated remaining: <span className="text-white font-mono font-medium">~4s</span>
          </div>
        </div>

        {/* Right: Vertical Checklist */}
        <div className="lg:col-span-8 bg-[#151B38]/80 backdrop-blur-md rounded-xl border border-[#1E2648] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8F9CAE] mb-4">
              Scan Pipeline Phases
            </h3>
            <div className="space-y-3.5">
              {steps.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#0E1326]/60 border border-[#1E2648]/80">
                  <div className="flex items-center gap-3">
                    {s.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-[#16B887]" />}
                    {s.status === 'in-progress' && <CircleDot className="w-4 h-4 text-[#66D9F5] animate-spin" />}
                    {s.status === 'pending' && <Clock className="w-4 h-4 text-[#77819D]" />}
                    <span className={`text-xs font-medium ${s.status === 'in-progress' ? 'text-white' : s.status === 'completed' ? 'text-[#C5D0E6]' : 'text-[#77819D]'}`}>
                      {s.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    s.status === 'completed' ? 'bg-[#16B887]/15 text-[#16B887]' :
                    s.status === 'in-progress' ? 'bg-[#66D9F5]/15 text-[#66D9F5] font-semibold' :
                    'bg-[#1E2648] text-[#77819D]'
                  }`}>
                    {s.status === 'completed' ? 'Completed' : s.status === 'in-progress' ? 'In progress' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Log Panel & Current Task */}
      <div className="relative z-10 mt-6 bg-[#090D1C] rounded-xl border border-[#1E2648] p-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#1E2648] text-[11px] text-[#8F9CAE]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#6554F0]" />
            <span>Current Task: <strong className="text-white">Scanning OWASP Top 10 rules on endpoints</strong></span>
          </div>
          <span className="text-[#16B887] flex items-center gap-1">
            <Activity className="w-3 h-3 animate-pulse" /> Live Stream
          </span>
        </div>
        <div className="mt-3 space-y-1 text-[11px] text-[#A6B4C9] max-h-24 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="leading-relaxed">{log}</div>
          ))}
        </div>
      </div>

      {/* Non-destructive notice */}
      <div className="relative z-10 mt-4 flex items-center justify-center gap-2 text-[11px] text-[#8F9CAE]">
        <ShieldAlert className="w-3.5 h-3.5 text-[#FFAD42]" />
        <span>SecAI scans are fully authorized and non-destructive. No active exploits or payloads are delivered.</span>
      </div>
    </div>
  );
};
