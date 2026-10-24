import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, Search, ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { Finding, Severity } from '../../types/security';

interface SecurityFindingsProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  onNavigateToRemediation: (findingId?: string) => void;
}

export const SecurityFindings: React.FC<SecurityFindingsProps> = ({
  findings,
  onSelectFinding,
  onNavigateToRemediation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const safeFindings = Array.isArray(findings) ? findings : [];
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filtered = safeFindings.filter((f) => {
    const matchesSearch = [f.title, f.location, f.owasp, f.impact, f.cwe]
      .filter((v): v is string => typeof v === 'string')
      .some((v) => v.toLowerCase().includes(normalizedSearch));
    const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
    const matchesCategory = categoryFilter === 'all' || f.owasp === categoryFilter;
    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'critical':
      case 'high':
        return { bg: 'bg-[#F45D75]/10', text: 'text-[#F45D75]', border: 'border-[#F45D75]/25', icon: ShieldAlert };
      case 'medium':
        return { bg: 'bg-[#FFAD42]/10', text: 'text-[#FFAD42]', border: 'border-[#FFAD42]/20', icon: AlertTriangle };
      default:
        return { bg: 'bg-[#66D9F5]/10', text: 'text-[#342D8C]', border: 'border-[#66D9F5]/30', icon: Info };
    }
  };

  const categories = Array.from(new Set(safeFindings.map(f => f.owasp).filter(Boolean)));

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Controls */}
      <div className="bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F0EDFF] text-[#6554F0]">
                {filtered.length} Findings
              </span>
              <span className="text-xs text-[#77819D]">AST Static Analysis</span>
            </div>
            <h2 className="text-2xl font-bold text-[#18213D] mt-1">Security Findings</h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToRemediation(filtered[0]?.id)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-xs font-semibold text-white shadow-xs flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" /> Remediation Playbook
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#77819D]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, route, OWASP code..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7F8FC] border border-[#E7E9F3] rounded-lg focus:outline-none focus:border-[#6554F0] text-[#18213D]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize cursor-pointer whitespace-nowrap ${
                  severityFilter === sev ? 'bg-[#6554F0] text-white' : 'bg-[#F7F8FC] text-[#77819D] border border-[#E7E9F3]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-[#F7F8FC] border border-[#E7E9F3] rounded-lg text-[#18213D] focus:outline-none cursor-pointer"
          >
            <option value="all">All OWASP Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Findings Cards */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-10 text-center text-[#77819D]">
            <Info className="w-7 h-7 mx-auto mb-2 text-[#6554F0]" />
            <p className="text-sm font-medium text-[#18213D]">
              {safeFindings.length === 0 ? 'No findings reported' : 'No findings match current filter'}
            </p>
            <p className="text-xs mt-1">Run a scan or reset filters to view issues.</p>
          </div>
        ) : (
          filtered.map((finding) => {
            const badge = getSeverityBadge(finding.severity);
            const SevIcon = badge.icon;
            return (
              <div
                key={finding.id}
                onClick={() => {
                  onSelectFinding(finding);
                  onNavigateToRemediation(finding.id);
                }}
                className="bg-white rounded-xl border border-[#E7E9F3] p-4 hover:border-[#6554F0]/40 hover:shadow-sm transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${badge.bg} ${badge.text} ${badge.border}`}>
                    <SevIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {finding.severity}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#F0EDFF] text-[#6554F0]">
                        {finding.owasp} • {finding.cwe || 'CWE'}
                      </span>
                      <span className="text-[11px] font-mono text-[#77819D] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {finding.location || 'HTTP Header'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#18213D] mt-1 group-hover:text-[#6554F0] transition-colors">
                      {finding.title}
                    </h4>
                    <p className="text-xs text-[#77819D] mt-0.5 line-clamp-1">
                      {finding.impact || 'Identified security risk.'}
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-[#F7F8FC] group-hover:bg-[#F0EDFF] group-hover:text-[#6554F0] text-xs font-semibold text-[#18213D] flex items-center gap-1 shrink-0 self-end md:self-center transition-all">
                  Remediate <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
