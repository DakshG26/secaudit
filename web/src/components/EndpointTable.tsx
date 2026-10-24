import React from 'react';
import { ShieldCheck, AlertCircle, FileCode } from 'lucide-react';
import { Endpoint } from '../types/security';

interface EndpointTableProps {
  endpoints: Endpoint[];
}

export const EndpointTable: React.FC<EndpointTableProps> = ({ endpoints }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            Endpoint Inventory ({endpoints.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            AST-extracted Flask/FastAPI routes with handlers, parameter bindings, and auth wrappers.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0d1629]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#070c18] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Method</th>
              <th className="py-3 px-4">Route Path</th>
              <th className="py-3 px-4">Handler</th>
              <th className="py-3 px-4">Inputs & Params</th>
              <th className="py-3 px-4">Auth Decorators</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {endpoints.map((ep, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-4">
                  <div className="flex gap-1 flex-wrap">
                    {ep.method.map((m) => (
                      <span
                        key={m}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          m === 'GET'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : m === 'POST'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-purple-950 text-purple-300 border border-purple-800'
                        }`}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 px-4 font-semibold text-white">{ep.path}</td>
                <td className="py-2.5 px-4 text-cyan-300">{ep.handler}()</td>
                <td className="py-2.5 px-4 text-slate-400">
                  {ep.request_inputs.length > 0 ? (
                    <span className="text-amber-300">{ep.request_inputs.join(', ')}</span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-slate-300">
                  {ep.auth_decorators.length > 0 ? (
                    <span className="text-emerald-400">{ep.auth_decorators.join(', ')}</span>
                  ) : (
                    <span className="text-slate-600">None</span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {ep.is_protected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Protected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                      <AlertCircle className="w-3 h-3 text-amber-400" /> Exposed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
