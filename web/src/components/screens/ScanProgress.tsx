import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  CircleDot, 
  Clock, 
  XOctagon, 
  Terminal, 
  ShieldAlert, 
  Activity,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ScanProgressProps {
  onCancel?: () => void;
  onViewResults?: () => void;
  target?: string;
  isLiveScanning?: boolean;
  totalFindings?: number;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({
  onCancel,
  onViewResults,
  target = 'https://github.com/demo/ai-web-vulnerable',
  isLiveScanning = false,
  totalFindings = 0,
}) => {
  const [progress, setProgress] = useState(isLiveScanning ? 25 : 100);

  useEffect(() => {
    if (isLiveScanning) {
      setProgress(15);
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 92 ? prev + Math.floor(Math.random() * 8 + 3) : prev));
      }, 350);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [isLiveScanning]);

  const isComplete = !isLiveScanning && progress === 100;

  const steps = [
    { label: 'Collecting endpoints & route topology', status: 'completed' },
    { label: 'Static code & AST security analysis', status: 'completed' },
    { label: 'Checking configurations & HTTP headers', status: 'completed' },
    { label: 'Scanning OWASP Top 10 vulnerabilities', status: isComplete ? 'completed' : 'in-progress' },
    { label: 'Generating attack chains & remediation report', status: isComplete ? 'completed' : 'pending' },
  ];

  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="rounded-2xl bg-[#0E1326] text-white p-6 md:p-8 border border-[#1E2648] shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#6554F0]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#66D9F5]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1E2648]">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isComplete ? 'bg-[#16B887]' : 'bg-[#66D9F5] animate-ping'}`} />
            <span className={`text-xs font-mono font-medium tracking-wide uppercase ${isComplete ? 'text-[#16B887]' : 'text-[#66D9F5]'}`}>
              {isComplete ? 'Audit Finished' : 'Active Scan'}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            {isComplete ? 'Security Audit Completed!' : 'Running Security Scan…'}
          </h2>
          <p className="text-xs text-[#8F9CAE] mt-0.5 font-mono truncate max-w-xl">
            Target: <span className="text-[#66D9F5]">{target}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isLiveScanning && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-[#151B38] hover:bg-[#1E2648] border border-[#2A3460] text-xs font-medium text-[#F45D75] transition-all flex items-center gap-2 cursor-pointer"
            >
              <XOctagon className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
          {onViewResults && (
            <button
              onClick={onViewResults}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-xs font-semibold text-white shadow-lg shadow-[#6554F0]/30 hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
            >
              {isComplete ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#16B887]" />
                  <span>Explore {totalFindings} Findings & Flows</span>
                </>
              ) : (
                <>
                  <span>View Findings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Circular Ring & Phases */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-7">
        <div className="lg:col-span-4 bg-[#151B38]/80 backdrop-blur-md rounded-xl border border-[#1E2648] p-6 flex flex-col items-center justify-center text-center">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" stroke="#1E2648" strokeWidth="8" fill="transparent" />
              <circle
                cx="50" cy="50" r="44"
                stroke={isComplete ? '#16B887' : '#6554F0'}
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
              <span className={`text-[11px] font-mono ${isComplete ? 'text-[#16B887]' : 'text-[#66D9F5]'}`}>
                {isComplete ? 'Audit Ready' : 'In Progress'}
              </span>
            </div>
          </div>
          <div className="mt-4 text-xs text-[#8F9CAE]">
            {isComplete ? (
              <span className="text-[#16B887] font-semibold">100% complete — all checks executed</span>
            ) : (
              <>Estimated remaining: <span className="text-white font-mono font-medium">~3s</span></>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-[#151B38]/80 backdrop-blur-md rounded-xl border border-[#1E2648] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8F9CAE] mb-4">
              Audit Pipeline Stages
            </h3>
            <div className="space-y-3">
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

      {/* Terminal Log */}
      <div className="relative z-10 mt-6 bg-[#090D1C] rounded-xl border border-[#1E2648] p-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#1E2648] text-[11px] text-[#8F9CAE]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#6554F0]" />
            <span>Task Stream: <strong className="text-white">{isComplete ? 'Audit Complete' : 'Executing Checks'}</strong></span>
          </div>
          <span className="text-[#16B887] flex items-center gap-1">
            <Activity className="w-3 h-3 animate-pulse" /> {isComplete ? 'Idle' : 'Active'}
          </span>
        </div>
        <div className="mt-3 space-y-1 text-[11px] text-[#A6B4C9] max-h-24 overflow-y-auto">
          <div>[*] Initializing SecAI authorized audit engine v1.0...</div>
          <div>[+] Target: {target}</div>
          <div>[✓] Route inventory & topology mapped</div>
          <div>[✓] OWASP Top 10 rule set evaluated</div>
          {isComplete && <div className="text-[#16B887] font-semibold">[✓] Scan finished! Click 'Explore Findings' above.</div>}
        </div>
      </div>

      {/* Notice */}
      <div className="relative z-10 mt-4 flex items-center justify-center gap-2 text-[11px] text-[#8F9CAE]">
        <ShieldAlert className="w-3.5 h-3.5 text-[#FFAD42]" />
        <span>SecAI scans are fully non-destructive and authorized. No exploitative payloads are transmitted.</span>
      </div>
    </div>
  );
};
