import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Globe, 
  Server
} from 'lucide-react';
import { Endpoint } from '../../types/security';

interface EndpointMapProps {
  endpoints: Endpoint[];
  onSelectEndpoint?: (path: string) => void;
}

export const EndpointMap: React.FC<EndpointMapProps> = ({ endpoints }) => {
  const [search, setSearch] = useState('');

  const filtered = endpoints.filter(e => 
    e.path.toLowerCase().includes(search.toLowerCase()) || 
    (e.handler && e.handler.toLowerCase().includes(search.toLowerCase()))
  );

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
            Explore the structural architecture of your web endpoints and access security posture.
          </p>
        </div>

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

      {/* Main Layout: Left SVG Node Map + Right Summary Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Topology Diagram Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E7E9F3] p-6 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between z-10">
            <div className="text-xs font-semibold text-[#18213D] flex items-center gap-2">
              <Server className="w-4 h-4 text-[#6554F0]" />
              Application Topology Graph ({endpoints.length} Routes)
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#77819D]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F45D75]" /> At Risk</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#16B887]" /> Protected</span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative my-4 flex items-center justify-center min-h-[280px]">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 280">
              <path d="M 300 140 C 200 140, 180 50, 100 50" stroke="#16B887" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.6" />
              <path d="M 300 140 C 200 140, 180 140, 100 140" stroke="#66D9F5" strokeWidth="2" fill="none" opacity="0.7" />
              <path d="M 300 140 C 200 140, 180 230, 100 230" stroke="#F45D75" strokeWidth="2.5" fill="none" opacity="0.8" />
              <path d="M 300 140 C 400 140, 420 50, 500 50" stroke="#F45D75" strokeWidth="2.5" fill="none" opacity="0.8" />
              <path d="M 300 140 C 400 140, 420 140, 500 140" stroke="#FFAD42" strokeWidth="2" fill="none" opacity="0.7" />
              <path d="M 300 140 C 400 140, 420 230, 500 230" stroke="#6554F0" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.6" />
            </svg>

            {/* Central Node */}
            <div className="z-10 w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#6554F0] to-[#342D8C] text-white p-2.5 flex flex-col items-center justify-center text-center shadow-lg shadow-[#6554F0]/30 border-2 border-white">
              <Globe className="w-5 h-5 mb-1 text-[#66D9F5]" />
              <div className="font-bold text-xs tracking-tight">Your App</div>
              <div className="text-[9px] opacity-80 font-mono">Live Target</div>
            </div>

            {/* Node Clusters */}
            <div className="absolute left-4 top-4 z-10 p-2 rounded-xl bg-white border border-[#16B887]/40 shadow-xs text-xs font-bold text-[#18213D]">
              <span className="w-2 h-2 inline-block rounded-full bg-[#16B887] mr-1.5" /> Frontend (UI)
            </div>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-white border border-[#66D9F5]/40 shadow-xs text-xs font-bold text-[#18213D]">
              <span className="w-2 h-2 inline-block rounded-full bg-[#66D9F5] mr-1.5" /> Static Assets
            </div>
            <div className="absolute left-4 bottom-4 z-10 p-2 rounded-xl bg-white border border-[#F45D75]/40 shadow-xs text-xs font-bold text-[#18213D]">
              <span className="w-2 h-2 inline-block rounded-full bg-[#F45D75] mr-1.5 animate-ping" /> /api Endpoints
            </div>
            <div className="absolute right-4 top-4 z-10 p-2 rounded-xl bg-white border border-[#F45D75]/40 shadow-xs text-xs font-bold text-[#18213D]">
              <span className="w-2 h-2 inline-block rounded-full bg-[#F45D75] mr-1.5 animate-ping" /> /admin Cluster
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-white border border-[#FFAD42]/40 shadow-xs text-xs font-bold text-[#18213D]">
              <span className="w-2 h-2 inline-block rounded-full bg-[#FFAD42] mr-1.5" /> /auth Endpoints
            </div>
            <div className="absolute right-4 bottom-4 z-10 p-2 rounded-xl bg-white border border-[#6554F0]/40 shadow-xs text-xs font-bold text-[#18213D]">
              <span className="w-2 h-2 inline-block rounded-full bg-[#6554F0] mr-1.5" /> /webhook Ingress
            </div>
          </div>
        </div>

        {/* Right Summary Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D] mb-4">Protection Ratio</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F45D75" strokeWidth="4" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#16B887" strokeWidth="4" strokeDasharray={`${Math.round((totalProtected / (endpoints.length || 1)) * 100)}, 100`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#18213D]">
                  {Math.round((totalProtected / (endpoints.length || 1)) * 100)}%
                </div>
              </div>
              <div className="text-xs space-y-1 flex-1">
                <div className="flex justify-between">
                  <span className="text-[#16B887] font-medium flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Protected:</span>
                  <span className="font-bold text-[#18213D]">{totalProtected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#F45D75] font-medium flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Open:</span>
                  <span className="font-bold text-[#18213D]">{totalExposed}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D] mb-3">HTTP Methods</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-[#F7F8FC] border border-[#E7E9F3] flex justify-between">
                <span className="font-mono font-bold text-[#6554F0]">GET</span>
                <span className="font-bold">{getMethodCount('GET') || 1}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#F7F8FC] border border-[#E7E9F3] flex justify-between">
                <span className="font-mono font-bold text-[#16B887]">POST</span>
                <span className="font-bold">{getMethodCount('POST') || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discovered Endpoints Table */}
      <div className="bg-white rounded-2xl border border-[#E7E9F3] overflow-hidden shadow-xs">
        <div className="p-4 px-6 border-b border-[#E7E9F3] bg-[#F7F8FC] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#18213D]">Discovered Routes ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto max-h-60 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E7E9F3] text-[#77819D] bg-white sticky top-0">
              <tr>
                <th className="py-2.5 px-6">Method</th>
                <th className="py-2.5 px-6">Path</th>
                <th className="py-2.5 px-6">Access Guard</th>
                <th className="py-2.5 px-6">Protection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E9F3] text-[#18213D]">
              {filtered.slice(0, 15).map((ep, idx) => (
                <tr key={idx} className="hover:bg-[#F7F8FC]">
                  <td className="py-2.5 px-6 font-mono font-bold text-[#6554F0]">{ep.method.join(', ')}</td>
                  <td className="py-2.5 px-6 font-mono">{ep.path}</td>
                  <td className="py-2.5 px-6 text-[#77819D] font-mono">{ep.auth_decorators.join(', ') || 'none'}</td>
                  <td className="py-2.5 px-6">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      ep.is_protected ? 'bg-[#16B887]/15 text-[#16B887]' : 'bg-[#F45D75]/15 text-[#F45D75]'
                    }`}>
                      {ep.is_protected ? 'PROTECTED' : 'OPEN'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
