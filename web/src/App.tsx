import React, { useState, useEffect } from 'react';
import { Sidebar, ScreenId } from './components/Sidebar';
import { Header } from './components/Header';
import { HomeDashboard } from './components/screens/HomeDashboard';
import { ScanProgress } from './components/screens/ScanProgress';
import { SecurityFindings } from './components/screens/SecurityFindings';
import { EndpointMap } from './components/screens/EndpointMap';
import { SecurityReport } from './components/screens/SecurityReport';
import { RemediationGuide } from './components/screens/RemediationGuide';
import { SettingsView } from './components/screens/SettingsView';
import { BoardView } from './components/screens/BoardView';
import { ScanResult, Finding } from './types/security';
import { MOCK_VULNERABLE_SCAN, MOCK_CLEAN_SCAN } from './data/mockData';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [viewMode, setViewMode] = useState<'interactive' | 'board'>('interactive');
  const [scan, setScan] = useState<ScanResult>(MOCK_VULNERABLE_SCAN);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(scan.findings[0] || null);
  const [loading, setLoading] = useState(false);
  const [activeScanTarget, setActiveScanTarget] = useState<string>('sample:vulnerable');
  const [backendLive, setBackendLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.status === 'healthy') setBackendLive(true); })
      .catch(() => {});
  }, []);

  const handleStartScan = async (url: string) => {
    setLoading(true);
    setError(null);
    setActiveScanTarget(url);
    setCurrentScreen('scan');

    if (url === 'sample:clean' || url === 'clean') {
      await new Promise((r) => setTimeout(r, 600));
      setScan(MOCK_CLEAN_SCAN);
      setSelectedFinding(null);
      setLoading(false);
      setCurrentScreen('report');
      return;
    }
    if (url === 'sample:vulnerable' || url === 'vulnerable') {
      await new Promise((r) => setTimeout(r, 600));
      setScan(MOCK_VULNERABLE_SCAN);
      setSelectedFinding(MOCK_VULNERABLE_SCAN.findings[0] || null);
      setLoading(false);
      setCurrentScreen('report');
      return;
    }

    if (backendLive) {
      try {
        const res = await fetch('http://localhost:8000/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (res.ok) {
           setScan(data);
           setSelectedFinding(data.findings?.[0] || null);
           await new Promise((r) => setTimeout(r, 600));
           setCurrentScreen('report');
        } else {
          setError(data.error ?? 'Scan execution failed');
        }
      } catch {
        setError('Cannot connect to SecAI engine on port 8000');
      } finally {
        setLoading(false);
      }
      return;
    }

    await new Promise((r) => setTimeout(r, 900));
    const sim = { ...MOCK_VULNERABLE_SCAN, target: url, scan_time: new Date().toISOString() };
    setScan(sim);
    setSelectedFinding(sim.findings[0] || null);
    setCurrentScreen('report');
    setLoading(false);
  };

  const displayTarget = loading ? activeScanTarget : scan.target;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F8FC] text-[#18213D] font-sans antialiased">
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={(s) => { setCurrentScreen(s); setViewMode('interactive'); }}
        isBackendLive={backendLive}
        activeTarget={displayTarget}
        findingsCount={scan.findings.length}
        endpointsCount={scan.endpoints.length}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          currentScreen={currentScreen}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode((p) => (p === 'interactive' ? 'board' : 'interactive'))}
          onQuickScan={() => setCurrentScreen('home')}
          target={displayTarget}
          isBackendLive={backendLive}
        />

        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-[#F45D75]/10 border border-[#F45D75]/25 text-[#F45D75] text-xs font-medium flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="underline font-bold cursor-pointer">Dismiss</button>
            </div>
          )}

          {viewMode === 'board' ? (
            <BoardView
              scan={scan}
              onSelectScreen={(s) => { setCurrentScreen(s); setViewMode('interactive'); }}
              onSelectFinding={setSelectedFinding}
              onStartScan={handleStartScan}
              selectedFindingId={selectedFinding?.id}
              isLiveScanning={loading}
            />
          ) : (
            <>
              {currentScreen === 'home' && (
                <HomeDashboard scan={scan} onStartScan={handleStartScan} onNavigate={setCurrentScreen} isLoading={loading} />
              )}
              {currentScreen === 'scan' && (
                <ScanProgress
                  target={displayTarget}
                  isLiveScanning={loading}
                  totalFindings={scan.findings.length}
                   onCancel={() => { setLoading(false); setCurrentScreen('home'); }}
                   onViewResults={() => setCurrentScreen('report')}
                />
              )}
              {currentScreen === 'findings' && (
                <SecurityFindings
                  findings={scan.findings}
                  onSelectFinding={setSelectedFinding}
                  onNavigateToRemediation={(id) => {
                    if (id) {
                      const f = scan.findings.find(item => item.id === id);
                      if (f) setSelectedFinding(f);
                    }
                    setCurrentScreen('remediation');
                  }}
                />
              )}
              {currentScreen === 'endpoints' && <EndpointMap endpoints={scan.endpoints} />}
              {currentScreen === 'report' && <SecurityReport scan={scan} />}
              {currentScreen === 'remediation' && (
                <RemediationGuide findings={scan.findings} selectedFindingId={selectedFinding?.id} />
              )}
              {currentScreen === 'settings' && (
                <SettingsView target={scan.target} onRunScan={handleStartScan} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
