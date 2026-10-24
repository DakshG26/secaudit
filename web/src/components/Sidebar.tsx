import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Radar, 
  ShieldAlert, 
  Network, 
  FileText, 
  Wrench, 
  Settings
} from 'lucide-react';

export type ScreenId = 'home' | 'scan' | 'findings' | 'endpoints' | 'report' | 'remediation' | 'settings';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  isBackendLive: boolean;
  activeTarget: string;
  findingsCount?: number;
  endpointsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  isBackendLive,
  activeTarget,
  findingsCount = 0,
  endpointsCount = 0,
}) => {
  const navItems = [
    { id: 'home' as ScreenId, label: 'Home', icon: LayoutDashboard },
    { id: 'scan' as ScreenId, label: 'Scan Progress', icon: Radar },
    { id: 'findings' as ScreenId, label: 'Findings', icon: ShieldAlert, badge: findingsCount, badgeColor: findingsCount > 0 ? 'bg-[#F45D75] text-white' : 'bg-[#16B887]/20 text-[#16B887]' },
    { id: 'endpoints' as ScreenId, label: 'Endpoints', icon: Network, badge: endpointsCount, badgeColor: 'bg-[#6554F0]/15 text-[#6554F0]' },
    { id: 'report' as ScreenId, label: 'Security Report', icon: FileText },
    { id: 'remediation' as ScreenId, label: 'Remediation', icon: Wrench },
    { id: 'settings' as ScreenId, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E7E9F3] flex flex-col justify-between shrink-0 select-none z-30">
      <div>
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#E7E9F3]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6554F0] to-[#66D9F5] flex items-center justify-center text-white shadow-sm shadow-[#6554F0]/30">
            <Shield className="w-5 h-5 fill-white/20" strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-[#18213D]">SecAI</span>
              <span className="text-[9px] font-mono font-semibold uppercase px-1.5 py-0.2 bg-[#F0EDFF] text-[#6554F0] rounded">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-[#77819D]">AI App Security Auditor</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#F0EDFF] text-[#6554F0] font-semibold shadow-xs'
                    : 'text-[#77819D] hover:text-[#18213D] hover:bg-[#F7F8FC]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#6554F0]' : 'text-[#77819D]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {item.id === 'scan' && currentScreen === 'scan' && (
                  <span className="w-2 h-2 rounded-full bg-[#66D9F5] animate-ping" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#E7E9F3] space-y-3">
        <div className="flex items-center justify-between text-xs font-mono px-3 py-2 rounded-lg bg-[#F7F8FC] border border-[#E7E9F3]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-[#16B887]' : 'bg-[#FFAD42]'}`} />
            <span className="text-[11px] text-[#18213D]">
              {isBackendLive ? 'Engine Live' : 'Demo Mode'}
            </span>
          </div>
          <span className="text-[10px] text-[#77819D]">Port 8000</span>
        </div>

        <div className="text-[11px] font-mono text-[#77819D] px-1 truncate" title={activeTarget}>
          Target: <span className="text-[#18213D] font-medium">{activeTarget || 'demo_app'}</span>
        </div>
      </div>
    </aside>
  );
};
