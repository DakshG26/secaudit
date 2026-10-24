import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Pillars } from './components/Pillars';
import { InteractiveFeatures } from './components/InteractiveFeatures';
import { Protocol } from './components/Protocol';
import { AuditWorkspace } from './components/AuditWorkspace';
import { ServicesGrid } from './components/ServicesGrid';
import { Footer } from './components/Footer';
import { ScanResult } from './types/security';
import { MOCK_VULNERABLE_SCAN, MOCK_CLEAN_SCAN } from './data/mockData';

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

    // Scroll smoothly to the workspace
    const el = document.getElementById('audit');
    if (el) el.scrollIntoView({ behavior: 'smooth' });

    // If backend is live, execute real AST & rule scan
    if (isBackendLive) {
      try {
        const response = await fetch('http://localhost:8000/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await response.json();
        if (response.ok) {
          setScanResult(data);
        } else {
          setErrorMsg(data.error || 'Scan failed on target repository');
        }
      } catch (err: any) {
        setErrorMsg('Failed to connect to SecAudit API engine: ' + err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Offline UI Fallback simulation
    if (url === 'sample:clean' || url === 'clean' || url === 'demo_app_fixed') {
      setTimeout(() => { setScanResult(MOCK_CLEAN_SCAN); setIsLoading(false); }, 400);
      return;
    }
    setTimeout(() => {
      setScanResult({ ...MOCK_VULNERABLE_SCAN, target: url, scan_time: new Date().toISOString() });
      setIsLoading(false);
    }, 600);
  };

  const handleSelectPreset = (p: 'vulnerable' | 'clean') => {
    setScanResult(p === 'clean' ? MOCK_CLEAN_SCAN : MOCK_VULNERABLE_SCAN);
    const el = document.getElementById('audit');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-[#070b14] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* 5% Noise overlay from build-premium-website design system */}
      <div className="noise-overlay" />

      <Navbar onSelectPreset={handleSelectPreset} isBackendLive={isBackendLive} />

      <main className="relative z-10">
        <Hero onScan={handleScan} isLoading={isLoading} />

        <Pillars />

        <InteractiveFeatures
          chains={scanResult.chains}
          matrix={scanResult.access_matrix}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            const el = document.getElementById('flows');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <Protocol />

        <AuditWorkspace
          scanResult={scanResult}
          isLoading={isLoading}
          errorMsg={errorMsg}
          onScan={handleScan}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <ServicesGrid />
      </main>

      <Footer />
    </div>
  );
};

export default App;
