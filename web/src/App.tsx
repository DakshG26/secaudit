import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ScanInput } from './components/ScanInput';
import { ScoreCard } from './components/ScoreCard';
import { AttackFlows } from './components/AttackFlows';
import { FindingsList } from './components/FindingsList';
import { AccessMatrix } from './components/AccessMatrix';
import { EndpointTable } from './components/EndpointTable';
import { Footer } from './components/Footer';
import { ScanResult } from './types/security';
import { MOCK_VULNERABLE_SCAN, MOCK_CLEAN_SCAN } from './data/mockData';
import { Network, ShieldAlert, Lock, FileCode, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const [scanResult, setScanResult] = useState<ScanResult>(MOCK_VULNERABLE_SCAN);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBackendLive, setIsBackendLive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'flows' | 'findings' | 'matrix' | 'endpoints'>('flows');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check backend server on load
  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.status === 'healthy') setIsBackendLive(true);
      })
      .catch(() => setIsBackendLive(false));
  }, []);

  const handleScan = async (url: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    if (url === 'sample:clean' || url === 'clean' || url === 'demo_app_fixed') {
      setTimeout(() => { setScanResult(MOCK_CLEAN_SCAN); setIsLoading(false); }, 600);
      return;
    }
    if (url === 'sample:vulnerable' || url === 'vulnerable' || url === 'demo_app') {
      setTimeout(() => { setScanResult(MOCK_VULNERABLE_SCAN); setIsLoading(false); }, 600);
      return;
    }

    if (isBackendLive) {
      try {
        const response = await fetch('http://localhost:8000/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await response.json();
        if (response.ok) setScanResult(data);
        else setErrorMsg(data.error || 'Scan failed on remote target');
      } catch (err: any) {
        setErrorMsg('Failed to connect to SecAudit API engine: ' + err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setTimeout(() => {
      setScanResult({ ...MOCK_VULNERABLE_SCAN, target: url, scan_time: new Date().toISOString() });
      setIsLoading(false);
    }, 1000);
  };

  const handleSelectPreset = (p: 'vulnerable' | 'clean') => {
    setScanResult(p === 'clean' ? MOCK_CLEAN_SCAN : MOCK_VULNERABLE_SCAN);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      <Navbar onSelectPreset={handleSelectPreset} isBackendLive={isBackendLive} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Hero />

        <ScanInput
          onScan={handleScan}
          isLoading={isLoading}
          activeTarget={scanResult.target}
        />

        {errorMsg && (
          <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold">Scan Error</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        <ScoreCard scan={scanResult} />

        {/* Tab Navigation */}
        <div className="border-b border-slate-800 mb-6">
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

        {/* Tab Views */}
        <div>
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
      </main>

      <Footer />
    </div>
  );
};

export default App;
