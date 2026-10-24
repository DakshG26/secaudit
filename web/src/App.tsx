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
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendLive, setBackendLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.status === 'healthy') setBackendLive(true);
      })
      .catch(() => {});
  }, []);

  const handleStartScan = async (url: string) => {
    setLoading(true);
    setError(null);
    setCurrentScreen('scan');

    // Instant local presets
    if (url === 'sample:clean') {
      await new Promise((r) => setTimeout(r, 700));
      setScan(MOCK_CLEAN_SCAN);
      setLoading(false);
      return;
    }
    if (url === 'sample:vulnerable') {
      await new Promise((r) => setTimeout(r, 700));
      setScan(MOCK_VULNERABLE_SCAN);
      setLoading(false);
      return;
    }

    // Live backend scan
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
          await new Promise((r) => setTimeout(r, 800));
          setCurrentScreen('findings');
        } else {
          setError(data.error ?? 'Scan execution failed');
        }
      } catch (err: any) {
        setError('Cannot connect to SecAI engine on port 8000');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Fallback simulation
    await new Promise((r) => setTimeout(r, 1200));
    setScan({ ...MOCK_VULNERABLE_SCAN, target: url, scan_time: new Date().toISOString() });
    setCurrentScreen('findings');
    setLoading(false);
  };

  const handleSelectFinding = (finding: Finding) => {
    setSelectedFinding(finding);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F8FC] text-[#18213D] font-sans antialiased">
      {/* Slim Pale Left Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          setCurrentScreen(screen);
          setViewMode('interactive');
        }}
        isBackendLive={backendLive}
        activeTarget={scan.target}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentScreen={currentScreen}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode((prev) => (prev === 'interactive' ? 'board' : 'interactive'))}
          onQuickScan={() => setCurrentScreen('home')}
          target={scan.target}
          isBackendLive={backendLive}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#F45D75]/10 border border-[#F45D75]/25 text-[#F45D75] text-xs font-medium flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="underline cursor-pointer font-bold">Dismiss</button>
            </div>
          )}

          {viewMode === 'board' ? (
            <BoardView
              scan={scan}
              onSelectScreen={(s) => {
                setCurrentScreen(s);
                setViewMode('interactive');
              }}
              onSelectFinding={handleSelectFinding}
            />
          ) : (
            <>
              {currentScreen === 'home' && (
                <HomeDashboard
                  scan={scan}
                  onStartScan={handleStartScan}
                  onNavigate={setCurrentScreen}
                  isLoading={loading}
                />
              )}

              {currentScreen === 'scan' && (
                <ScanProgress
                  target={scan.target}
                  isLiveScanning={loading}
                  totalFindings={scan.findings.length}
                  onCancel={() => setCurrentScreen('home')}
                  onViewResults={() => setCurrentScreen('findings')}
                />
              )}

              {currentScreen === 'findings' && (
                <SecurityFindings
                  findings={scan.findings}
                  onSelectFinding={handleSelectFinding}
                  onNavigateToRemediation={() => setCurrentScreen('remediation')}
                />
              )}

              {currentScreen === 'endpoints' && (
                <EndpointMap endpoints={scan.endpoints} />
              )}

              {currentScreen === 'report' && (
                <SecurityReport scan={scan} />
              )}

              {currentScreen === 'remediation' && (
                <RemediationGuide
                  findings={scan.findings}
                  selectedFindingId={selectedFinding?.id}
                />
              )}

              {currentScreen === 'settings' && (
                <SettingsView />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
