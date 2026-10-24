import React from 'react';
import { Endpoint } from '../types/security';
import { FileCode, ShieldCheck, AlertCircle } from 'lucide-react';

interface EndpointTableProps { endpoints: Endpoint[]; }

const METHOD_COLOR: Record<string, string> = {
  GET:    'bg-blue-100 text-blue-700 border-blue-200',
  POST:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  PUT:    'bg-purple-100 text-purple-700 border-purple-200',
  PATCH:  'bg-amber-100 text-amber-700 border-amber-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
};

export const EndpointTable: React.FC<EndpointTableProps> = ({ endpoints }) => (
  <div className="space-y-4">
    <div>
      <h2 className="font-display font-bold text-xl text-ink flex items-center gap-2">
        <FileCode className="w-5 h-5 text-primary" /> Route Inventory
        <span className="text-sm font-body font-normal text-muted">({endpoints.length} routes found)</span>
      </h2>
      <p className="text-sm text-muted mt-0.5">
        All routes discovered by reading the source code — no server needed.
      </p>
    </div>

    <div className="overflow-x-auto rounded-2xl border-2 border-divider bg-surface shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-background border-b border-divider text-xs font-mono uppercase tracking-wider text-muted">
          <tr>
            <th className="py-3 px-4 text-left">Method</th>
            <th className="py-3 px-4 text-left">Route</th>
            <th className="py-3 px-4 text-left">Handler Function</th>
            <th className="py-3 px-4 text-left">User Inputs</th>
            <th className="py-3 px-4 text-left">Auth</th>
            <th className="py-3 px-4 text-right">Protected?</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {endpoints.map((ep, i) => (
            <tr key={i} className={`hover:bg-background/60 transition-colors ${!ep.is_protected ? 'bg-red-50/30' : ''}`}>
              <td className="py-2.5 px-4">
                <div className="flex gap-1 flex-wrap">
                  {ep.method.map(m => (
                    <span key={m} className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${METHOD_COLOR[m] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {m}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-2.5 px-4 font-mono font-semibold text-ink text-xs">{ep.path}</td>
              <td className="py-2.5 px-4 font-mono text-xs text-primary">{ep.handler}()</td>
              <td className="py-2.5 px-4 font-mono text-xs">
                {ep.request_inputs.length > 0
                  ? <span className="text-amber-700">{ep.request_inputs.join(', ')}</span>
                  : <span className="text-divider">—</span>}
              </td>
              <td className="py-2.5 px-4 font-mono text-xs">
                {ep.auth_decorators.length > 0
                  ? <span className="text-emerald-700">{ep.auth_decorators.join(', ')}</span>
                  : <span className="text-muted italic">None</span>}
              </td>
              <td className="py-2.5 px-4 text-right">
                {ep.is_protected
                  ? <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                      <ShieldCheck className="w-3 h-3" /> Protected
                    </span>
                  : <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      <AlertCircle className="w-3 h-3" /> Open
                    </span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
