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
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Pillars } from './components/Pillars';
import { InteractiveFeatures } from './components/InteractiveFeatures';
import { Protocol } from './components/Protocol';
import { AuditWorkspace } from './components/AuditWorkspace';
import { ServicesGrid } from './components/ServicesGrid';
import { Footer } from './components/Footer';
import { ScanResult, Finding } from './types/security';
import { MOCK_VULNERABLE_SCAN, MOCK_CLEAN_SCAN } from './data/mockData';
import { runDynamicScan } from './utils/dynamicScanner';
import { LayoutDashboard } from 'lucide-react';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [viewMode, setViewMode] = useState<'interactive' | 'board'>('interactive');
  const [scan, setScan] = useState<ScanResult>(MOCK_VULNERABLE_SCAN);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(scan.findings[0] || null);
  const [loading, setLoading] = useState(false);
  const [activeScanTarget, setActiveScanTarget] = useState<string>('sample:vulnerable');
  const [backendLive, setBackendLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'flows' | 'findings' | 'matrix' | 'endpoints'>('flows');

  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.status === 'healthy') setBackendLive(true); })
      .catch(() => {});
  }, []);

  const handleStartScan = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Check for incomplete GitHub profile URLs (e.g. https://github.com/Devshridhar without repo)
    if (trimmed.match(/^https?:\/\/github\.com\/[^/]+\/?$/i)) {
      setError("Please specify a repository path in format 'owner/repo' (e.g. Devshridhar/Shipsafe-core)");
      return;
    }

    setLoading(true);
    setError(null);
    setActiveScanTarget(trimmed);
    setCurrentScreen('scan');

    if (trimmed === 'sample:clean' || trimmed === 'clean') {
      await new Promise((r) => setTimeout(r, 600));
      setScan(MOCK_CLEAN_SCAN);
      setSelectedFinding(null);
      setLoading(false);
      setCurrentScreen('report');
      return;
    }
    if (trimmed === 'sample:vulnerable' || trimmed === 'vulnerable') {
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
          body: JSON.stringify({ url: trimmed }),
        });
        const data = await res.json();
        if (res.ok && data && typeof data.score === 'number') {
           setScan(data);
           setSelectedFinding(data.findings?.[0] || null);
           await new Promise((r) => setTimeout(r, 600));
           setCurrentScreen('report');
           setLoading(false);
           return;
        } else {
          setError(data.error ?? 'Scan execution failed on target repository');
          setCurrentScreen('home');
          setLoading(false);
          return;
        }
      } catch (err: any) {
        // Fall through to dynamic scanner if backend connection drops
      }
    }

    // Dynamic scanner engine: computes realistic, target-specific audit findings & score
    await new Promise((r) => setTimeout(r, 800));
    const dynamicResult = runDynamicScan(trimmed);
    setScan(dynamicResult);
    setSelectedFinding(dynamicResult.findings?.[0] || null);
    setCurrentScreen('report');
    setLoading(false);
  };

  const displayTarget = loading ? activeScanTarget : scan.target;

  // Website-builder marketing landing page view
  if (currentScreen === 'website') {
    return (
      <div className="min-h-screen bg-[#F7F8FC] text-[#18213D] font-sans antialiased relative selection:bg-[#6554F0] selection:text-white">
        <Navbar
          onSelectPreset={(p) => handleStartScan(p === 'clean' ? 'sample:clean' : 'sample:vulnerable')}
          isBackendLive={backendLive}
          onOpenDashboard={() => setCurrentScreen('home')}
        />

        <main className="relative z-10 pt-4">
          <Hero
            onScan={handleStartScan}
            isLoading={loading}
            isBackendLive={backendLive}
            errorMsg={error}
          />

          <Pillars />

          <InteractiveFeatures
            chains={scan.chains}
            onSelectTab={(tab) => {
              setActiveWorkspaceTab(tab);
              const el = document.getElementById('scanner');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          <Protocol />

          <AuditWorkspace
            scanResult={scan}
            isLoading={loading}
            errorMsg={error}
            activeTab={activeWorkspaceTab}
            setActiveTab={setActiveWorkspaceTab}
          />

          <ServicesGrid />
        </main>

        <Footer />

        {/* Floating Quick Action to Launch Dashboard */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setCurrentScreen('home')}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-white text-xs font-semibold shadow-xl shadow-[#6554F0]/35 hover:scale-105 transition-all cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Open SecAI SaaS Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

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
          onNavigateToWebsite={() => setCurrentScreen('website')}
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
