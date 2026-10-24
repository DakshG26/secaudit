import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Globe, 
  Unlock, 
  Server
} from 'lucide-react';
import { Endpoint } from '../../types/security';

interface EndpointMapProps {
  endpoints: Endpoint[];
  onSelectEndpoint?: (path: string) => void;
}

export const EndpointMap: React.FC<EndpointMapProps> = ({ endpoints }) => {
  const [search, setSearch] = useState('');

  const getMethodCount = (method: string) => 
    endpoints.filter(e => e.method.includes(method)).length;

  const totalProtected = endpoints.filter(e => e.is_protected).length;
  const totalExposed = endpoints.length - totalProtected;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E7E9F3] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6554F0]" />
            <span className="text-xs font-semibold text-[#6554F0] uppercase tracking-wider">Topology Visualizer</span>
          </div>
          <h2 className="text-2xl font-bold text-[#18213D] mt-1">Endpoint Inventory & Relationship Map</h2>
          <p className="text-xs text-[#77819D]">
            Explore the structural architecture of your web endpoints and visualize access vulnerabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#77819D]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter routes..."
              className="pl-8 pr-3 py-1.5 text-xs bg-[#F7F8FC] border border-[#E7E9F3] rounded-lg text-[#18213D] focus:outline-none focus:border-[#6554F0]"
            />
          </div>
        </div>
      </div>

      {/* Main Layout: Left SVG Node Map + Right Summary Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Relationship Diagram Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E7E9F3] p-6 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[460px]">
          <div className="flex items-center justify-between z-10">
            <div className="text-xs font-semibold text-[#18213D] flex items-center gap-2">
              <Server className="w-4 h-4 text-[#6554F0]" />
              Application Topology Graph
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#77819D]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F45D75]" /> At Risk</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#16B887]" /> Protected</span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative my-6 flex items-center justify-center min-h-[340px]">
            {/* SVG Connecting Curves */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 340">
              <path d="M 300 170 C 200 170, 180 70, 100 70" stroke="#16B887" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.6" />
              <path d="M 300 170 C 200 170, 180 170, 100 170" stroke="#66D9F5" strokeWidth="2" fill="none" opacity="0.7" />
              <path d="M 300 170 C 200 170, 180 270, 100 270" stroke="#F45D75" strokeWidth="2.5" fill="none" opacity="0.8" />
              <path d="M 300 170 C 400 170, 420 70, 500 70" stroke="#F45D75" strokeWidth="2.5" fill="none" opacity="0.8" />
              <path d="M 300 170 C 400 170, 420 170, 500 170" stroke="#FFAD42" strokeWidth="2" fill="none" opacity="0.7" />
              <path d="M 300 170 C 400 170, 420 270, 500 270" stroke="#6554F0" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.6" />
            </svg>

            {/* Central "Your App" Node */}
            <div className="z-10 w-28 h-28 rounded-2xl bg-gradient-to-tr from-[#6554F0] to-[#342D8C] text-white p-3 flex flex-col items-center justify-center text-center shadow-lg shadow-[#6554F0]/30 border-2 border-white">
              <Globe className="w-6 h-6 mb-1 text-[#66D9F5]" />
              <div className="font-bold text-xs tracking-tight">Your App</div>
              <div className="text-[9px] opacity-80 font-mono mt-0.5">Flask / Node</div>
            </div>

            {/* Surrounding Nodes positioned absolutely */}
            <div className="absolute left-6 top-8 z-10 p-2.5 rounded-xl bg-white border border-[#16B887]/40 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16B887]" />
              <div>
                <div className="text-xs font-bold text-[#18213D]">Frontend UI</div>
                <div className="text-[10px] text-[#77819D] font-mono">/ (GET) • Public</div>
              </div>
            </div>

            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-xl bg-white border border-[#66D9F5]/40 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#66D9F5]" />
              <div>
                <div className="text-xs font-bold text-[#18213D]">Static Assets</div>
                <div className="text-[10px] text-[#77819D] font-mono">/static/**</div>
              </div>
            </div>

            <div className="absolute left-6 bottom-8 z-10 p-2.5 rounded-xl bg-white border border-[#F45D75]/40 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F45D75] animate-ping" />
              <div>
                <div className="text-xs font-bold text-[#18213D]">/api Endpoints</div>
                <div className="text-[10px] text-[#F45D75] font-mono">/search • SQL Risk</div>
              </div>
            </div>

            <div className="absolute right-6 top-8 z-10 p-2.5 rounded-xl bg-white border border-[#F45D75]/40 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F45D75] animate-ping" />
              <div>
                <div className="text-xs font-bold text-[#18213D]">/admin Cluster</div>
                <div className="text-[10px] text-[#F45D75] font-mono">/admin • No Auth</div>
              </div>
            </div>

            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-xl bg-white border border-[#FFAD42]/40 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFAD42]" />
              <div>
                <div className="text-xs font-bold text-[#18213D]">/auth Service</div>
                <div className="text-[10px] text-[#77819D] font-mono">/login, /token</div>
              </div>
            </div>

            <div className="absolute right-6 bottom-8 z-10 p-2.5 rounded-xl bg-white border border-[#6554F0]/40 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6554F0]" />
              <div>
                <div className="text-xs font-bold text-[#18213D]">/webhook Ingress</div>
                <div className="text-[10px] text-[#77819D] font-mono">/events (POST)</div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#77819D] flex items-center justify-between border-t border-[#E7E9F3] pt-3">
            <span>Hover or click a cluster to highlight route dependencies</span>
            <span className="font-mono text-[#6554F0]">Connected to 8 active handlers</span>
          </div>
        </div>

        {/* Right Summary Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Donut Chart Protection Ratio */}
          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D] mb-4">
              Endpoint Protection Ratio
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F45D75" strokeWidth="4" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#16B887" strokeWidth="4" strokeDasharray="30, 100" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#18213D]">
                  {Math.round((totalProtected / (endpoints.length || 1)) * 100)}%
                </div>
              </div>
              <div className="text-xs space-y-1.5 flex-1">
                <div className="flex justify-between">
                  <span className="text-[#16B887] font-medium flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Protected:</span>
                  <span className="font-bold text-[#18213D]">{totalProtected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#F45D75] font-medium flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Unprotected:</span>
                  <span className="font-bold text-[#18213D]">{totalExposed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* HTTP Method Counts */}
          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D] mb-3">HTTP Methods</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#F7F8FC] border border-[#E7E9F3] flex justify-between items-center">
                <span className="font-mono font-bold text-[#6554F0]">GET</span>
                <span className="font-bold text-[#18213D]">{getMethodCount('GET') || 7}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F7F8FC] border border-[#E7E9F3] flex justify-between items-center">
                <span className="font-mono font-bold text-[#16B887]">POST</span>
                <span className="font-bold text-[#18213D]">{getMethodCount('POST') || 1}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F7F8FC] border border-[#E7E9F3] flex justify-between items-center">
                <span className="font-mono font-bold text-[#FFAD42]">PUT</span>
                <span className="font-bold text-[#18213D]">{getMethodCount('PUT') || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F7F8FC] border border-[#E7E9F3] flex justify-between items-center">
                <span className="font-mono font-bold text-[#F45D75]">DELETE</span>
                <span className="font-bold text-[#18213D]">{getMethodCount('DELETE') || 0}</span>
              </div>
            </div>
          </div>

          {/* Top Security Risks */}
          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D] mb-2.5">Top Identified Risks</h3>
            <ul className="text-xs space-y-2 text-[#18213D]">
              <li className="flex items-start gap-2 p-2 rounded-lg bg-[#F45D75]/5 border border-[#F45D75]/20">
                <Unlock className="w-3.5 h-3.5 text-[#F45D75] shrink-0 mt-0.5" />
                <span><code>/admin</code> has no authentication decorator.</span>
              </li>
              <li className="flex items-start gap-2 p-2 rounded-lg bg-[#FFAD42]/5 border border-[#FFAD42]/20">
                <Unlock className="w-3.5 h-3.5 text-[#FFAD42] shrink-0 mt-0.5" />
                <span><code>/user/&lt;id&gt;</code> lacks tenant ownership check.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
