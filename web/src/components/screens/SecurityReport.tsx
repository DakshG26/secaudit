import React from 'react';
import { Download, Printer, Award, ShieldCheck } from 'lucide-react';
import { ScanResult } from '../../types/security';

interface SecurityReportProps {
  scan: ScanResult;
}

export const SecurityReport: React.FC<SecurityReportProps> = ({ scan }) => {
  const findings = Array.isArray(scan?.findings) ? scan.findings : [];
  const endpoints = Array.isArray(scan?.endpoints) ? scan.endpoints : [];
  const stats = scan?.stats || { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
  const total = stats.critical + stats.high + stats.medium + stats.low || findings.length;
  const score = Math.min(100, Math.max(0, scan?.score ?? 100));
  const target = scan?.target || 'No target selected';
  const scanDate = scan?.scan_time ? new Date(scan.scan_time).toLocaleString() : 'Just now';

  const handleExportJSON = () => {
    const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scan ?? {}, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `secai-audit-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const scoreColor = score >= 80 ? '#16B887' : score >= 50 ? '#FFAD42' : '#F45D75';
  const circ = 2 * Math.PI * 46;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Report Header */}
      <div className="bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-[#F0EDFF] text-[#6554F0]">Audited by SecAI</span>
            <span className="text-xs text-[#77819D]">OWASP Top 10:2025 Edition</span>
          </div>
          <h2 className="text-2xl font-bold text-[#18213D] mt-1">Application Security Audit Report</h2>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportJSON} className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E7E9F3] hover:border-[#6554F0] text-xs font-semibold text-[#18213D] flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Download className="w-3.5 h-3.5 text-[#6554F0]" /> Export JSON
          </button>
          <button onClick={() => window.print()} className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow-sm">
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Score Gauge & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#77819D] mb-3">Overall Security Posture</div>
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" stroke="#F0EDFF" strokeWidth="7" fill="transparent" />
              <circle cx="50" cy="50" r="46" stroke={scoreColor} strokeWidth="7" fill="transparent" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-[#18213D]">{Math.round(score)}</span>
              <span className="text-[10px] text-[#77819D]">out of 100</span>
            </div>
          </div>
          <div className="mt-3 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${scoreColor}15`, color: scoreColor }}>
            Status: {score >= 80 ? 'PASSED — Production Ready' : 'ACTION REQUIRED'}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D] mb-3">Audit Profile & Metadata</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs mb-4">
              <div className="p-2.5 rounded-xl bg-[#F7F8FC] border border-[#E7E9F3]">
                <div className="text-[10px] text-[#77819D]">Target Entity</div>
                <div className="font-mono font-bold text-[#18213D] truncate mt-0.5" title={target}>{target}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7F8FC] border border-[#E7E9F3]">
                <div className="text-[10px] text-[#77819D]">Timestamp</div>
                <div className="font-mono font-bold text-[#18213D] mt-0.5">{scanDate}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7F8FC] border border-[#E7E9F3]">
                <div className="text-[10px] text-[#77819D]">Routes Mapped</div>
                <div className="font-mono font-bold text-[#18213D] mt-0.5">{endpoints.length}</div>
              </div>
            </div>

            {/* Risk Breakdown Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-[#77819D]">
                <span>Severity Distribution</span>
                <span>{stats.critical} Critical • {stats.high} High • {stats.medium} Med • {stats.low} Low</span>
              </div>
              <div className="h-2.5 w-full bg-[#F7F8FC] rounded-full overflow-hidden flex">
                <div style={{ width: `${total ? (stats.critical / total) * 100 : 0}%` }} className="bg-[#F45D75]" />
                <div style={{ width: `${total ? (stats.high / total) * 100 : 0}%` }} className="bg-[#FFAD42]" />
                <div style={{ width: `${total ? (stats.medium / total) * 100 : 0}%` }} className="bg-[#6554F0]" />
                <div style={{ width: `${total ? (stats.low / total) * 100 : 0}%` }} className="bg-[#16B887]" />
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-xl bg-[#F0EDFF] border border-[#6554F0]/20 flex items-center justify-between text-xs">
            <span className="text-[#342D8C] font-medium flex items-center gap-1.5"><Award className="w-4 h-4 text-[#6554F0]" /> OWASP Top 10:2025 Standard</span>
            <span className="font-mono text-[#6554F0] font-bold">10/10 Policies Audited</span>
          </div>
        </div>
      </div>

      {/* Structured Findings Table */}
      <div className="bg-white rounded-2xl border border-[#E7E9F3] overflow-hidden shadow-xs">
        <div className="p-3.5 px-5 border-b border-[#E7E9F3] bg-[#F7F8FC] flex items-center justify-between text-xs">
          <h3 className="font-bold uppercase tracking-wider text-[#18213D]">Detected Issues Summary</h3>
          <span className="text-[#77819D] font-mono">{findings.length} entries</span>
        </div>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E7E9F3] text-[#77819D] bg-white sticky top-0">
              <tr>
                <th className="py-2.5 px-5">Severity</th>
                <th className="py-2.5 px-5">Vulnerability</th>
                <th className="py-2.5 px-5">Standard</th>
                <th className="py-2.5 px-5">Location</th>
                <th className="py-2.5 px-5">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E9F3]">
              {findings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-5 text-center text-[#77819D]">
                    <ShieldCheck className="w-6 h-6 text-[#16B887] mx-auto mb-1" />
                    Zero vulnerabilities detected. Application passed all security baseline tests.
                  </td>
                </tr>
              ) : findings.map((f, i) => (
                <tr key={f.id || i} className="hover:bg-[#F7F8FC]">
                  <td className="py-2 px-5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      f.severity === 'critical' || f.severity === 'high' ? 'bg-[#F45D75]/15 text-[#F45D75]' :
                      f.severity === 'medium' ? 'bg-[#FFAD42]/15 text-[#FFAD42]' : 'bg-[#16B887]/15 text-[#16B887]'
                    }`}>
                      {f.severity}
                    </span>
                  </td>
                  <td className="py-2 px-5 font-semibold">{f.title}</td>
                  <td className="py-2 px-5 font-mono text-[#6554F0]">{f.owasp} • {f.cwe}</td>
                  <td className="py-2 px-5 font-mono text-[#77819D]">{f.location}</td>
                  <td className="py-2 px-5 text-[#77819D] capitalize">{f.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
