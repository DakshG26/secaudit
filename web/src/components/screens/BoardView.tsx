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
}

export const BoardView: React.FC<BoardViewProps> = ({
  scan,
  onSelectScreen,
  onSelectFinding
}) => {
  const screens: { id: ScreenId; title: string; num: string; component: React.ReactNode }[] = [
    {
      id: 'home',
      num: 'Screen 1',
      title: 'Home Dashboard',
      component: (
        <HomeDashboard
          scan={scan}
          onStartScan={() => onSelectScreen('scan')}
          onNavigate={(s) => onSelectScreen(s as ScreenId)}
          isLoading={false}
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
          onCancel={() => onSelectScreen('home')}
          onViewResults={() => onSelectScreen('findings')}
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
          onNavigateToRemediation={() => onSelectScreen('remediation')}
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
      component: <RemediationGuide findings={scan.findings} />,
    },
    {
      id: 'settings',
      num: 'Screen 7',
      title: 'Settings & Rule Configuration',
      component: <SettingsView />,
    },
  ];

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-300">
      {/* Board Presentation Banner */}
      <div className="bg-gradient-to-r from-[#6554F0] via-[#342D8C] to-[#18213D] text-white rounded-2xl p-6 md:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#66D9F5] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> High-Fidelity UI Design Board
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">SecAI Presentation Board</h2>
          <p className="text-xs md:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
            All seven application screens rendered simultaneously in a cohesive design grid. Click any screen card to open its full interactive view.
          </p>
        </div>
        <div className="text-xs font-mono bg-white/10 px-4 py-2.5 rounded-xl border border-white/15 text-[#66D9F5] shrink-0">
          7 Screens • Figma Ready
        </div>
      </div>

      {/* Screens Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {screens.map((item) => (
          <div
            key={item.id}
            className="group relative bg-[#F7F8FC] rounded-2xl border-2 border-[#E7E9F3] hover:border-[#6554F0] transition-all p-4 md:p-6 shadow-sm hover:shadow-xl flex flex-col justify-between"
          >
            {/* Board Header for this screen */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E7E9F3]">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#6554F0] text-white">
                  {item.num}
                </span>
                <span className="text-sm font-bold text-[#18213D]">{item.title}</span>
              </div>
              <button
                onClick={() => onSelectScreen(item.id)}
                className="text-xs font-semibold text-[#6554F0] hover:text-[#342D8C] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E7E9F3] shadow-xs cursor-pointer group-hover:bg-[#F0EDFF] transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Open Screen
              </button>
            </div>

            {/* Screen Inner Container */}
            <div className="overflow-hidden rounded-xl bg-white border border-[#E7E9F3] p-3 md:p-4 shadow-inner max-h-[640px] overflow-y-auto">
              {item.component}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
