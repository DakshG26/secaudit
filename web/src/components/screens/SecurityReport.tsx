import React from 'react';
import { 
  Download, 
  Printer, 
  Award
} from 'lucide-react';
import { ScanResult } from '../../types/security';

interface SecurityReportProps {
  scan: ScanResult;
}

export const SecurityReport: React.FC<SecurityReportProps> = ({ scan }) => {
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `secai-audit-report-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const scoreColor = scan.score >= 80 ? '#16B887' : scan.score >= 50 ? '#FFAD42' : '#F45D75';
  const circumference = 2 * Math.PI * 46;
  const strokeDashoffset = circumference - (scan.score / 100) * circumference;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Report Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E7E9F3] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-[#F0EDFF] text-[#6554F0]">
              Audited by SecAI
            </span>
            <span className="text-xs text-[#77819D]">OWASP Top 10:2025 Edition</span>
          </div>
          <h2 className="text-2xl font-bold text-[#18213D] mt-1">Application Security Audit Report</h2>
          <p className="text-xs text-[#77819D]">
            Official compliance and vulnerability assessment ready for team review or jury presentation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E7E9F3] hover:border-[#6554F0] text-xs font-semibold text-[#18213D] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#6554F0]" />
            Export JSON
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-[#6554F0]/25"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Score Gauge & Metadata Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Score Gauge */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E7E9F3] p-6 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#77819D] mb-4">Overall Security Posture</div>
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" stroke="#F0EDFF" strokeWidth="7" fill="transparent" />
              <circle
                cx="50" cy="50" r="46"
                stroke={scoreColor}
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-[#18213D]">{scan.score}</span>
              <span className="text-xs font-medium text-[#77819D]">out of 100</span>
            </div>
          </div>

          <div className="mt-4 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${scoreColor}15`, color: scoreColor }}>
            Status: {scan.score >= 80 ? 'PASSED — Production Ready' : 'ACTION REQUIRED'}
          </div>
        </div>

        {/* Scan Metadata & Risk Breakdown */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E7E9F3] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D] mb-4">Audit Metadata & Profile</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-6">
              <div className="p-3 rounded-xl bg-[#F7F8FC] border border-[#E7E9F3]">
                <div className="text-[11px] text-[#77819D]">Target Entity</div>
                <div className="font-mono font-bold text-[#18213D] truncate mt-0.5">{scan.target}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F8FC] border border-[#E7E9F3]">
                <div className="text-[11px] text-[#77819D]">Timestamp</div>
                <div className="font-mono font-bold text-[#18213D] mt-0.5">{new Date(scan.scan_time).toLocaleDateString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F8FC] border border-[#E7E9F3]">
                <div className="text-[11px] text-[#77819D]">Rules Executed</div>
                <div className="font-mono font-bold text-[#18213D] mt-0.5">84 AST Rules</div>
              </div>
            </div>

            {/* Risk Breakdown Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-[#77819D]">
                <span>Severity Distribution</span>
                <span>{scan.stats.critical} Critical • {scan.stats.high} High • {scan.stats.medium} Med • {scan.stats.low} Low</span>
              </div>
              <div className="h-3 w-full bg-[#F7F8FC] rounded-full overflow-hidden flex">
                <div style={{ width: `${(scan.stats.critical / (scan.stats.total || 1)) * 100}%` }} className="bg-[#F45D75]" />
                <div style={{ width: `${(scan.stats.high / (scan.stats.total || 1)) * 100}%` }} className="bg-[#FFAD42]" />
                <div style={{ width: `${(scan.stats.medium / (scan.stats.total || 1)) * 100}%` }} className="bg-[#6554F0]" />
                <div style={{ width: `${(scan.stats.low / (scan.stats.total || 1)) * 100}%` }} className="bg-[#16B887]" />
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-[#F0EDFF] border border-[#6554F0]/20 flex items-center justify-between text-xs">
            <span className="text-[#342D8C] font-medium flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#6554F0]" />
              OWASP Top 10:2025 Standard Applied
            </span>
            <span className="font-mono text-[#6554F0] font-bold">A01-A10 Complete</span>
          </div>
        </div>
      </div>

      {/* Structured Findings Table */}
      <div className="bg-white rounded-2xl border border-[#E7E9F3] overflow-hidden shadow-xs">
        <div className="p-4 px-6 border-b border-[#E7E9F3] bg-[#F7F8FC] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#18213D]">Detected Issues Summary</h3>
          <span className="text-xs text-[#77819D] font-mono">{scan.findings.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E7E9F3] text-[#77819D] bg-white font-semibold">
              <tr>
                <th className="py-3 px-6">Severity</th>
                <th className="py-3 px-6">Vulnerability</th>
                <th className="py-3 px-6">Standard</th>
                <th className="py-3 px-6">Location</th>
                <th className="py-3 px-6">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E9F3] text-[#18213D]">
              {scan.findings.map((f) => (
                <tr key={f.id} className="hover:bg-[#F7F8FC] transition-colors">
                  <td className="py-3 px-6">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      f.severity === 'critical' || f.severity === 'high' ? 'bg-[#F45D75]/15 text-[#F45D75]' :
                      f.severity === 'medium' ? 'bg-[#FFAD42]/15 text-[#FFAD42]' : 'bg-[#16B887]/15 text-[#16B887]'
                    }`}>
                      {f.severity}
                    </span>
                  </td>
                  <td className="py-3 px-6 font-semibold">{f.title}</td>
                  <td className="py-3 px-6 font-mono text-[#6554F0]">{f.owasp} • {f.cwe}</td>
                  <td className="py-3 px-6 font-mono text-[#77819D]">{f.location}</td>
                  <td className="py-3 px-6 text-[#77819D] capitalize">{f.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
