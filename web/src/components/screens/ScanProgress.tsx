import React, { useEffect, useState } from 'react';
import { CheckCircle2, CircleDot, Clock, XOctagon, Terminal, ShieldAlert, Activity, ArrowRight, ShieldCheck } from 'lucide-react';

interface ScanProgressProps {
  onCancel?: () => void;
  onViewResults?: () => void;
  target?: string;
  isLiveScanning?: boolean;
  totalFindings?: number;
}

const STAGES = [
  { label: 'Collecting endpoints & route topology', at: 20 },
  { label: 'Static code & AST security analysis', at: 45 },
  { label: 'Checking configurations & HTTP headers', at: 70 },
  { label: 'Scanning OWASP Top 10 vulnerabilities', at: 90 },
  { label: 'Generating attack chains & remediation report', at: 100 },
];

export const ScanProgress: React.FC<ScanProgressProps> = ({
  onCancel,
  onViewResults,
  target = 'https://github.com/demo/ai-web-vulnerable',
  isLiveScanning = false,
  totalFindings = 0,
}) => {
  const [progress, setProgress] = useState(isLiveScanning ? 15 : 100);

  useEffect(() => {
    if (!isLiveScanning) {
      setProgress(100);
      return;
    }
    setProgress(15);
    const id = setInterval(() => {
      setProgress(p => (p >= 92 ? 92 : p + 7));
    }, 300);
    return () => clearInterval(id);
  }, [isLiveScanning]);

  const isComplete = !isLiveScanning && progress >= 100;
  const currentProgress = isComplete ? 100 : progress;
  const circ = 2 * Math.PI * 44;
  const offset = circ - (currentProgress / 100) * circ;

  const logs = [
    `[*] Initializing SecAI authorized audit engine...`,
    `[+] Target: ${target}`,
    currentProgress >= 20 ? `[✓] Discovered route topology and entrypoints` : null,
    currentProgress >= 45 ? `[✓] Completed AST multi-language code analysis` : null,
    currentProgress >= 70 ? `[✓] Verified HTTP headers, TLS, and cookies` : null,
    currentProgress >= 90 ? `[✓] OWASP Top 10 rule suite evaluated` : null,
    isComplete ? `[✓] Scan finished! Found ${totalFindings} findings. Click 'Explore Findings'.` : `[*] Running security probes...`,
  ].filter(Boolean);

  return (
    <div className="rounded-2xl bg-[#0E1326] text-white p-6 md:p-8 border border-[#1E2648] shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#6554F0]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#1E2648]">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isComplete ? 'bg-[#16B887]' : 'bg-[#66D9F5] animate-ping'}`} />
            <span className={`text-xs font-mono uppercase ${isComplete ? 'text-[#16B887]' : 'text-[#66D9F5]'}`}>
              {isComplete ? 'Audit Finished' : 'Active Scan'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            {isComplete ? 'Security Audit Completed!' : 'Running Security Scan…'}
          </h2>
          <p className="text-xs text-[#8F9CAE] mt-0.5 font-mono truncate max-w-xl">
            Target: <span className="text-[#66D9F5]">{target}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isLiveScanning && onCancel && (
            <button
              onClick={onCancel}
              className="px-3.5 py-2 rounded-xl bg-[#151B38] hover:bg-[#1E2648] border border-[#2A3460] text-xs font-medium text-[#F45D75] flex items-center gap-1.5 cursor-pointer"
            >
              <XOctagon className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
          {onViewResults && (
            <button
              onClick={onViewResults}
              disabled={!isComplete}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-xs font-semibold text-white shadow-md shadow-[#6554F0]/30 hover:scale-102 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isComplete ? <ShieldCheck className="w-4 h-4 text-[#16B887]" /> : null}
              <span>Explore {totalFindings} Findings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Circular Progress & Stages */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <div className="lg:col-span-4 bg-[#151B38]/80 rounded-xl border border-[#1E2648] p-5 flex flex-col items-center justify-center text-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" stroke="#1E2648" strokeWidth="8" fill="transparent" />
              <circle
                cx="50" cy="50" r="44"
                stroke={isComplete ? '#16B887' : '#6554F0'}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-white">{currentProgress}%</span>
              <span className={`text-[10px] font-mono ${isComplete ? 'text-[#16B887]' : 'text-[#66D9F5]'}`}>
                {isComplete ? 'Ready' : 'In Progress'}
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-[#8F9CAE]">
            {isComplete ? <span className="text-[#16B887]">100% complete — checks executed</span> : 'Progress advances as stages complete'}
          </div>
        </div>

        <div className="lg:col-span-8 bg-[#151B38]/80 rounded-xl border border-[#1E2648] p-5 flex flex-col justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8F9CAE] mb-3">Audit Stages</h3>
          <div className="space-y-2">
            {STAGES.map((s, idx) => {
              const prevAt = idx === 0 ? 0 : STAGES[idx - 1].at;
              const done = isComplete || currentProgress >= s.at;
              const active = !done && currentProgress >= prevAt;
              return (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0E1326]/60 border border-[#1E2648]/80">
                  <div className="flex items-center gap-2.5">
                    {done && <CheckCircle2 className="w-3.5 h-3.5 text-[#16B887]" />}
                    {active && <CircleDot className="w-3.5 h-3.5 text-[#66D9F5] animate-spin" />}
                    {!done && !active && <Clock className="w-3.5 h-3.5 text-[#77819D]" />}
                    <span className={`text-xs ${active ? 'text-white font-medium' : done ? 'text-[#C5D0E6]' : 'text-[#77819D]'}`}>
                      {s.label}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                    done ? 'bg-[#16B887]/15 text-[#16B887]' : active ? 'bg-[#66D9F5]/15 text-[#66D9F5]' : 'bg-[#1E2648] text-[#77819D]'
                  }`}>
                    {done ? 'Completed' : active ? 'In progress' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Terminal Log */}
      <div className="relative z-10 mt-5 bg-[#090D1C] rounded-xl border border-[#1E2648] p-3.5 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#1E2648] text-[10px] text-[#8F9CAE]">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-[#6554F0]" />
            <span>Task Stream: <strong className="text-white">{isComplete ? 'Complete' : 'Auditing'}</strong></span>
          </div>
          <span className="text-[#16B887] flex items-center gap-1">
            <Activity className="w-3 h-3 animate-pulse" /> {isComplete ? 'Idle' : 'Active'}
          </span>
        </div>
        <div className="mt-2.5 space-y-1 text-[11px] text-[#A6B4C9] max-h-20 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#8F9CAE]">
        <ShieldAlert className="w-3 h-3 text-[#FFAD42]" />
        <span>SecAI scans are fully non-destructive and authorized. No exploitative payloads transmitted.</span>
      </div>
    </div>
  );
};
