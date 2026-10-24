import React from 'react';
import { ScanResult } from '../types/security';
import { ScanInput } from './ScanInput';
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
  onScan: (url: string) => void;
  activeTab: 'flows' | 'findings' | 'matrix' | 'endpoints';
  setActiveTab: (tab: 'flows' | 'findings' | 'matrix' | 'endpoints') => void;
}

export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({
  scanResult,
  isLoading,
  errorMsg,
  onScan,
  activeTab,
  setActiveTab,
}) => {
  return (
    <section id="audit" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">Interactive Security Console</span>
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight mt-2">
          Live Repository <span className="font-serif italic text-cyan-300">Audit Workbench</span>
        </h2>
        <p className="text-slate-400 text-sm mt-3">
          Paste any public GitHub repository or test local demo targets. SecAudit will shallow-clone,
          extract routes via Python AST, match 21 OWASP rules, and compute attack chains in real-time.
        </p>
      </div>

      {/* Input */}
      <ScanInput onScan={onScan} isLoading={isLoading} activeTarget={scanResult.target} />

      {errorMsg && (
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="font-bold">Scan Error</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Score Card */}
      <ScoreCard scan={scanResult} />

      {/* Workspace Tabs */}
      <div id="flows" className="border-b border-slate-800 mb-8 pt-4">
        <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto pb-1 text-xs font-mono">
          <button
            onClick={() => setActiveTab('flows')}
            className={`flex items-center gap-2 py-3 px-2 border-b-2 font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'flows'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Attack Flows</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-950 text-red-300 border border-red-800">
              {scanResult.chains.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('findings')}
            className={`flex items-center gap-2 py-3 px-2 border-b-2 font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'findings'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Findings</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {scanResult.findings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 py-3 px-2 border-b-2 font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Zero-Trust Matrix</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {scanResult.access_matrix.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('endpoints')}
            className={`flex items-center gap-2 py-3 px-2 border-b-2 font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'endpoints'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Route Inventory</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {scanResult.endpoints.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Active Tab View */}
      <div className="min-h-[400px]">
        {activeTab === 'flows' && (
          <AttackFlows chains={scanResult.chains} findings={scanResult.findings} />
        )}
        {activeTab === 'findings' && (
          <FindingsList findings={scanResult.findings} />
        )}
        {activeTab === 'matrix' && (
          <AccessMatrix matrix={scanResult.access_matrix} />
        )}
        {activeTab === 'endpoints' && (
          <EndpointTable endpoints={scanResult.endpoints} />
        )}
      </div>
    </section>
  );
};
