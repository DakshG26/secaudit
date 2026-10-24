import React, { useState, useMemo } from 'react';
import { ShieldAlert, ShieldCheck, Search, Globe, Server } from 'lucide-react';
import { Endpoint } from '../../types/security';

interface EndpointMapProps {
  endpoints: Endpoint[];
  onSelectEndpoint?: (path: string) => void;
}

export const EndpointMap: React.FC<EndpointMapProps> = ({ endpoints = [] }) => {
  const [search, setSearch] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const safeEndpoints = Array.isArray(endpoints) ? endpoints : [];

  const clusters = useMemo(() => {
    const list: Array<{ id: string; name: string; count: number; match: (p: string) => boolean }> = [
      { id: 'all', name: 'All Routes', count: safeEndpoints.length, match: () => true }
    ];
    const map = new Map<string, number>();

    safeEndpoints.forEach(e => {
      const p = e.path.toLowerCase();
      let key = 'frontend';
      if (p.includes('/api')) key = '/api';
      else if (p.includes('admin') || p.includes('dashboard')) key = '/admin';
      else if (p.includes('auth') || p.includes('login') || p.includes('token')) key = '/auth';
      else if (p.includes('static') || p.includes('asset')) key = 'static';
      map.set(key, (map.get(key) || 0) + 1);
    });

    map.forEach((count, key) => {
      list.push({
        id: key,
        name: key === 'frontend' ? 'Frontend' : key,
        count,
        match: (p: string) => key === 'frontend' 
          ? p === '/' || (!p.includes('/api') && !p.includes('admin') && !p.includes('auth') && !p.includes('static'))
          : p.includes(key.replace('/', ''))
      });
    });
    return list;
  }, [safeEndpoints]);

  const activeClusterObj = clusters.find(c => c.id === selectedCluster);
  const filtered = safeEndpoints.filter(e => {
    const matchSearch = e.path.toLowerCase().includes(search.toLowerCase());
    const matchCluster = activeClusterObj ? activeClusterObj.match(e.path.toLowerCase()) : true;
    return matchSearch && matchCluster;
  });

  const totalProtected = safeEndpoints.filter(e => e.is_protected).length;
  const ratio = safeEndpoints.length > 0 ? Math.round((totalProtected / safeEndpoints.length) * 100) : 100;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6554F0]" />
            <span className="text-xs font-semibold text-[#6554F0] uppercase">Topology Visualizer</span>
          </div>
          <h2 className="text-2xl font-bold text-[#18213D] mt-1">Endpoint Inventory & Map</h2>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between z-10 text-xs">
            <span className="font-semibold text-[#18213D] flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-[#6554F0]" /> Discovered Graph</span>
            <div className="flex items-center gap-3 text-[11px] text-[#77819D]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F45D75]" /> Open</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#16B887]" /> Protected</span>
            </div>
          </div>

          <div className="relative my-4 flex items-center justify-center min-h-[190px]">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 190">
              <path d="M 300 95 C 200 95, 150 30, 80 30" stroke="#16B887" strokeWidth="2" strokeDasharray="3 3" fill="none" opacity="0.6" />
              <path d="M 300 95 C 200 95, 150 160, 80 160" stroke="#F45D75" strokeWidth="2" fill="none" opacity="0.7" />
              <path d="M 300 95 C 400 95, 450 30, 520 30" stroke="#FFAD42" strokeWidth="2" fill="none" opacity="0.7" />
              <path d="M 300 95 C 400 95, 450 160, 520 160" stroke="#6554F0" strokeWidth="2" strokeDasharray="3 3" fill="none" opacity="0.6" />
            </svg>

            <div className="z-10 w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#6554F0] to-[#342D8C] text-white p-2 flex flex-col items-center justify-center shadow-lg border-2 border-white">
              <Globe className="w-4 h-4 mb-0.5 text-[#66D9F5]" />
              <div className="font-bold text-[11px]">Your App</div>
              <div className="text-[9px] opacity-80 font-mono">{safeEndpoints.length} routes</div>
            </div>

            {clusters.filter(c => c.id !== 'all').slice(0, 4).map((c, i) => {
              const pos = ['left-2 top-2', 'left-2 bottom-2', 'right-2 top-2', 'right-2 bottom-2'][i];
              const isSel = selectedCluster === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCluster(isSel ? 'all' : c.id)}
                  className={`absolute ${pos} z-10 px-2.5 py-1.5 rounded-xl bg-white border text-xs font-semibold text-[#18213D] shadow-xs cursor-pointer hover:border-[#6554F0] transition-all ${
                    isSel ? 'ring-2 ring-[#6554F0] border-[#6554F0]' : 'border-[#E7E9F3]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 inline-block rounded-full bg-[#6554F0] mr-1" />
                  {c.name} ({c.count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D] mb-2.5">Protection Ratio</h3>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F45D75" strokeWidth="4" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#16B887" strokeWidth="4" strokeDasharray={`${ratio}, 100`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">{ratio}%</div>
              </div>
              <div className="text-xs space-y-0.5 flex-1">
                <div className="flex justify-between"><span className="text-[#16B887] font-medium flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Protected:</span><span className="font-bold">{totalProtected}</span></div>
                <div className="flex justify-between"><span className="text-[#F45D75] font-medium flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Open:</span><span className="font-bold">{safeEndpoints.length - totalProtected}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D] mb-2">HTTP Methods</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-[#F7F8FC] border border-[#E7E9F3] flex justify-between">
                <span className="font-mono font-bold text-[#6554F0]">GET</span>
                <span className="font-bold">{safeEndpoints.filter(e => Array.isArray(e.method) && e.method.includes('GET')).length}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#F7F8FC] border border-[#E7E9F3] flex justify-between">
                <span className="font-mono font-bold text-[#16B887]">POST</span>
                <span className="font-bold">{safeEndpoints.filter(e => Array.isArray(e.method) && e.method.includes('POST')).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E7E9F3] overflow-hidden shadow-xs">
        <div className="p-3 px-5 border-b border-[#E7E9F3] bg-[#F7F8FC] flex items-center justify-between text-xs">
          <h3 className="font-bold uppercase tracking-wider text-[#18213D]">Discovered Routes ({filtered.length})</h3>
          {selectedCluster !== 'all' && (
            <button onClick={() => setSelectedCluster('all')} className="text-[#6554F0] font-semibold hover:underline cursor-pointer">
              Show All Routes
            </button>
          )}
        </div>
        <div className="overflow-x-auto max-h-52 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E7E9F3] text-[#77819D] bg-white sticky top-0">
              <tr>
                <th className="py-2 px-5">Method</th>
                <th className="py-2 px-5">Path</th>
                <th className="py-2 px-5">Guard</th>
                <th className="py-2 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E9F3]">
              {filtered.slice(0, 30).map((ep, idx) => (
                <tr key={idx} className="hover:bg-[#F7F8FC]">
                  <td className="py-2 px-5 font-mono font-bold text-[#6554F0]">{Array.isArray(ep.method) ? ep.method.join(', ') : 'GET'}</td>
                  <td className="py-2 px-5 font-mono">{ep.path}</td>
                  <td className="py-2 px-5 text-[#77819D] font-mono">{ep.auth_decorators?.join(', ') || 'none'}</td>
                  <td className="py-2 px-5">
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
