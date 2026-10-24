import React from 'react';
import { 
  Grid, 
  Layout, 
  Play
} from 'lucide-react';
import { ScreenId } from './Sidebar';

interface HeaderProps {
  currentScreen: ScreenId;
  viewMode: 'interactive' | 'board';
  onToggleViewMode: () => void;
  onQuickScan: () => void;
  target: string;
  isBackendLive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  viewMode,
  onToggleViewMode,
  onQuickScan,
  target,
}) => {
  const screenTitles: Record<ScreenId, string> = {
    home: 'Home Dashboard',
    scan: 'Scan Progress',
    findings: 'Security Findings',
    endpoints: 'Endpoint Inventory & Map',
    report: 'Security Audit Report',
    remediation: 'Remediation Guide',
    settings: 'Settings & Configurations',
  };

  return (
    <header className="h-16 bg-white border-b border-[#E7E9F3] px-6 flex items-center justify-between z-20 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-[#77819D]">SecAI</span>
        <span className="text-[#E7E9F3]">/</span>
        <span className="font-bold text-[#18213D] capitalize">
          {viewMode === 'board' ? 'UI Presentation Board' : screenTitles[currentScreen]}
        </span>
      </div>

      {/* Target Pill & Controls */}
      <div className="flex items-center gap-3">
        {/* Active Target */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F7F8FC] border border-[#E7E9F3] text-xs">
          <span className="w-2 h-2 rounded-full bg-[#6554F0]" />
          <span className="text-[#77819D]">Target:</span>
          <span className="font-mono font-medium text-[#18213D] max-w-[200px] truncate">{target}</span>
        </div>

        {/* View Mode Toggle: Interactive vs UI Board */}
        <button
          onClick={onToggleViewMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            viewMode === 'board'
              ? 'bg-[#F0EDFF] border-[#6554F0] text-[#6554F0] shadow-xs'
              : 'bg-white border-[#E7E9F3] text-[#77819D] hover:text-[#18213D]'
          }`}
          title="Toggle between single screen and multi-screen UI design board"
        >
          {viewMode === 'board' ? (
            <>
              <Layout className="w-3.5 h-3.5 text-[#6554F0]" />
              <span>Back to Live View</span>
            </>
          ) : (
            <>
              <Grid className="w-3.5 h-3.5" />
              <span>UI Design Board</span>
            </>
          )}
        </button>

        {/* Start Scan Button */}
        <button
          onClick={onQuickScan}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-white text-xs font-semibold shadow-xs hover:shadow-md hover:shadow-[#6554F0]/25 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>New Scan</span>
        </button>
      </div>
    </header>
  );
};
