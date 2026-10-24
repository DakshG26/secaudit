import React from 'react';
import { HomeDashboard } from './HomeDashboard';
import { ScanProgress } from './ScanProgress';
import { SecurityFindings } from './SecurityFindings';
import { EndpointMap } from './EndpointMap';
import { SecurityReport } from './SecurityReport';
import { RemediationGuide } from './RemediationGuide';
import { SettingsView } from './SettingsView';
import { ScanResult, Finding } from '../../types/security';
import { ScreenId } from '../Sidebar';
import { Sparkles, Maximize2 } from 'lucide-react';

interface BoardViewProps {
  scan: ScanResult;
  onSelectScreen: (screen: ScreenId) => void;
  onSelectFinding: (finding: Finding) => void;
  onStartScan: (target: string) => void;
  selectedFindingId?: string;
  isLiveScanning?: boolean;
}

export const BoardView: React.FC<BoardViewProps> = ({
  scan,
  onSelectScreen,
  onSelectFinding,
  onStartScan,
  selectedFindingId,
  isLiveScanning = false
}) => {
  const screens: { id: ScreenId; title: string; num: string; component: React.ReactNode }[] = [
    {
      id: 'home',
      num: 'Screen 1',
      title: 'Home Dashboard',
      component: (
        <HomeDashboard
          scan={scan}
          onStartScan={(t) => { onStartScan(t); onSelectScreen('scan'); }}
          onNavigate={(s) => onSelectScreen(s as ScreenId)}
          isLoading={isLiveScanning}
        />
      ),
    },
    {
      id: 'scan',
      num: 'Screen 2',
      title: 'Scan Progress (Dark Navy Theme)',
      component: (
        <ScanProgress
          target={scan.target}
          totalFindings={scan.findings.length}
          isLiveScanning={isLiveScanning}
          onCancel={() => onSelectScreen('home')}
          onViewResults={() => onSelectScreen('report')}
        />
      ),
    },
    {
      id: 'findings',
      num: 'Screen 3',
      title: 'Security Findings',
      component: (
        <SecurityFindings
          findings={scan.findings}
          onSelectFinding={onSelectFinding}
          onNavigateToRemediation={(id) => {
            if (id) {
              const f = scan.findings.find(item => item.id === id);
              if (f) onSelectFinding(f);
            }
            onSelectScreen('remediation');
          }}
        />
      ),
    },
    {
      id: 'endpoints',
      num: 'Screen 4',
      title: 'Endpoint Inventory & Relationship Map',
      component: <EndpointMap endpoints={scan.endpoints} />,
    },
    {
      id: 'report',
      num: 'Screen 5',
      title: 'Security Audit Report',
      component: <SecurityReport scan={scan} />,
    },
    {
      id: 'remediation',
      num: 'Screen 6',
      title: 'Remediation Guide',
      component: (
        <RemediationGuide
          findings={scan.findings}
          selectedFindingId={selectedFindingId}
        />
      ),
    },
    {
      id: 'settings',
      num: 'Screen 7',
      title: 'Settings & Rule Configuration',
      component: (
        <SettingsView
          target={scan.target}
          onRunScan={(t) => { onStartScan(t); onSelectScreen('scan'); }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Board Presentation Banner */}
      <div className="bg-gradient-to-r from-[#6554F0] via-[#342D8C] to-[#18213D] text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#66D9F5] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> High-Fidelity UI Design Board
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">SecAI Presentation Board</h2>
          <p className="text-xs text-white/80 mt-1 max-w-xl">
            All seven application screens rendered simultaneously in a cohesive design grid. Click any screen card to open its full interactive view.
          </p>
        </div>
        <div className="text-xs font-mono bg-white/10 px-3.5 py-2 rounded-xl border border-white/15 text-[#66D9F5] shrink-0 self-start md:self-auto">
          7 Screens • Figma Ready
        </div>
      </div>

      {/* Screens Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {screens.map((item) => (
          <div
            key={item.id}
            className="group relative bg-[#F7F8FC] rounded-2xl border-2 border-[#E7E9F3] hover:border-[#6554F0] transition-all p-4 shadow-sm hover:shadow-xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#E7E9F3]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#6554F0] text-white">
                  {item.num}
                </span>
                <span className="text-sm font-bold text-[#18213D]">{item.title}</span>
              </div>
              <button
                onClick={() => onSelectScreen(item.id)}
                className="text-xs font-semibold text-[#6554F0] hover:text-[#342D8C] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E7E9F3] cursor-pointer group-hover:bg-[#F0EDFF] transition-all"
              >
                <Maximize2 className="w-3 h-3" /> Open
              </button>
            </div>

            <div className="overflow-hidden rounded-xl bg-white border border-[#E7E9F3] p-3 shadow-inner max-h-[560px] overflow-y-auto">
              {item.component}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
