import React from 'react';
import { ScanResult } from '../types/security';
import { ScoreCard } from './ScoreCard';
import { AttackFlows } from './AttackFlows';
import { FindingsList } from './FindingsList';
import { AccessMatrix } from './AccessMatrix';
import { EndpointTable } from './EndpointTable';
import { Network, ShieldAlert, Lock, FileCode, AlertTriangle } from 'lucide-react';

interface AuditWorkspaceProps {
  scanResult: ScanResult;
  isLoading: boolean;
  errorMsg: string | null;
  activeTab: 'flows' | 'findings' | 'matrix' | 'endpoints';
  setActiveTab: (t: 'flows' | 'findings' | 'matrix' | 'endpoints') => void;
}

export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({
  scanResult, isLoading, errorMsg, activeTab, setActiveTab,
}) => (
  <section id="scanner" className="py-16 bg-background">
    <div className="max-w-5xl mx-auto px-6 sm:px-10">
      {/* Error */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Scan failed</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mb-8 py-16 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-base font-display font-semibold text-ink">Reading source code…</p>
            <p className="text-sm text-muted max-w-sm">SecAudit is cloning the repo, parsing routes via AST, and running 21 security rules. This takes 5–15 seconds.</p>
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          <ScoreCard scan={scanResult} />

          {/* Tab bar */}
          <div className="border-b-2 border-divider mb-8">
            <nav className="flex overflow-x-auto gap-1">
              {[
                { key: 'flows',     label: 'Attack Paths',      icon: Network,    count: scanResult.chains.length,       warn: scanResult.chains.length > 0 },
                { key: 'findings',  label: 'Security Issues',   icon: ShieldAlert,count: scanResult.findings.length,     warn: scanResult.findings.length > 0 },
                { key: 'matrix',    label: 'Access Control',    icon: Lock,       count: scanResult.access_matrix.length, warn: false },
                { key: 'endpoints', label: 'All Routes',        icon: FileCode,   count: scanResult.endpoints.length,    warn: false },
              ].map(({ key, label, icon: Icon, count, warn }) => (
                <button key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-mono font-semibold whitespace-nowrap transition-colors cursor-pointer -mb-[2px] ${
                    activeTab === key
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    warn && count > 0 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-divider text-muted'
                  }`}>{count}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div className="animate-fade-in">
            {activeTab === 'flows'     && <AttackFlows chains={scanResult.chains} findings={scanResult.findings} />}
            {activeTab === 'findings'  && <FindingsList findings={scanResult.findings} />}
            {activeTab === 'matrix'    && <AccessMatrix matrix={scanResult.access_matrix} />}
            {activeTab === 'endpoints' && <EndpointTable endpoints={scanResult.endpoints} />}
          </div>
        </>
      )}
    </div>
  </section>
);
