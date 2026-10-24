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

const App: React.FC = () => {
  const [scan, setScan] = useState<ScanResult>(MOCK_VULNERABLE_SCAN);
  const [loading, setLoading] = useState(false);
  const [backendLive, setBackendLive] = useState(false);
  const [tab, setTab] = useState<'flows' | 'findings' | 'matrix' | 'endpoints'>('findings');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.status === 'healthy') setBackendLive(true); })
      .catch(() => {});
  }, []);

  const scrollToScanner = () => {
    document.getElementById('scanner')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScan = async (url: string) => {
    setLoading(true);
    setError(null);
    scrollToScanner();

    // Local presets — instant
    if (url === 'sample:clean') {
      await new Promise(r => setTimeout(r, 400));
      setScan(MOCK_CLEAN_SCAN);
      setTab('findings');
      setLoading(false);
      return;
    }
    if (url === 'sample:vulnerable') {
      await new Promise(r => setTimeout(r, 400));
      setScan(MOCK_VULNERABLE_SCAN);
      setTab('findings');
      setLoading(false);
      return;
    }

    // Live API scan (real repos)
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
          // Default to findings tab — most useful
          setTab(data.findings.length > 0 ? 'findings' : 'endpoints');
        } else {
          setError(data.error ?? 'Scan failed');
        }
      } catch (e: any) {
        setError('Cannot reach SecAudit API. Is the backend running on port 8000?');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Offline fallback
    await new Promise(r => setTimeout(r, 700));
    setScan({ ...MOCK_VULNERABLE_SCAN, target: url, scan_time: new Date().toISOString() });
    setLoading(false);
  };

  const handlePreset = (p: 'vulnerable' | 'clean') => {
    setScan(p === 'clean' ? MOCK_CLEAN_SCAN : MOCK_VULNERABLE_SCAN);
    setTab('findings');
    scrollToScanner();
  };

  const jumpToTab = (t: 'flows' | 'findings' | 'matrix' | 'endpoints') => {
    setTab(t);
    scrollToScanner();
  };

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="noise-overlay" />
      <Navbar onSelectPreset={handlePreset} isBackendLive={backendLive} />
      <main>
        <Hero onScan={handleScan} isLoading={loading} isBackendLive={backendLive} />
        <Pillars />
        <InteractiveFeatures chains={scan.chains} onSelectTab={jumpToTab} />
        <Protocol />
        <AuditWorkspace
          scanResult={scan}
          isLoading={loading}
          errorMsg={error}
          activeTab={tab}
          setActiveTab={setTab}
        />
        <ServicesGrid />
      </main>
      <Footer />
    </div>
  );
};

export default App;
