import React, { useState, useEffect } from 'react';
import { Check, Play } from 'lucide-react';

interface SettingsViewProps {
  target?: string;
  onRunScan?: (target: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ target = '', onRunScan }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'scan' | 'integrations'>('scan');
  const [baseUrl, setBaseUrl] = useState(target || 'http://localhost:5000');
  const [appName, setAppName] = useState(target ? `Audit Target (${target.split('/').pop() || target})` : 'AI Web App (Staging)');
  const [astDepth, setAstDepth] = useState('deep');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (target) {
      setBaseUrl(target);
      setAppName(`Audit Target (${target.split('/').pop() || target})`);
    }
  }, [target]);

  const [toggles, setToggles] = useState({
    owaspA01: true,
    owaspA02: true,
    owaspA04: true,
    owaspA05: true,
    owaspA10: true,
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6554F0]" />
            <span className="text-xs font-semibold text-[#6554F0] uppercase">Preferences</span>
          </div>
          <h2 className="text-2xl font-bold text-[#18213D] mt-1">Audit Engine Settings</h2>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F7F8FC] border border-[#E7E9F3] rounded-xl">
          {(['general', 'scan', 'integrations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                activeTab === tab ? 'bg-[#6554F0] text-white shadow-xs' : 'text-[#77819D] hover:text-[#18213D]'
              }`}
            >
              {tab === 'scan' ? 'Scan Rules' : tab}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {activeTab === 'general' && (
          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D]">General Information</h3>
            <div>
              <label className="block text-xs font-semibold text-[#18213D] mb-1">Application Name</label>
              <input
                type="text"
                value={appName}
                onChange={e => setAppName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F7F8FC] border border-[#E7E9F3] rounded-xl text-[#18213D] focus:outline-none focus:border-[#6554F0]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#18213D] mb-1">Target URL / Localhost Port</label>
              <input
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F7F8FC] border border-[#E7E9F3] rounded-xl text-[#18213D] focus:outline-none focus:border-[#6554F0]"
              />
            </div>
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D] mb-2.5">OWASP Top 10 Checks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'owaspA01' as const, label: 'A01: Broken Access Control (Decorators, IDOR)' },
                  { key: 'owaspA02' as const, label: 'A02: Security Misconfiguration (Headers, CORS)' },
                  { key: 'owaspA04' as const, label: 'A04: Cryptographic Failures (Hardcoded secrets)' },
                  { key: 'owaspA05' as const, label: 'A05: Injection (SQL, eval/exec commands)' },
                  { key: 'owaspA10' as const, label: 'A10: Information Leaks (Debug stack traces)' },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F8FC] border border-[#E7E9F3] cursor-pointer hover:border-[#6554F0]/30 transition-all">
                    <span className="text-xs font-medium text-[#18213D] pr-2">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={toggles[item.key]}
                      onChange={() => handleToggle(item.key)}
                      className="w-4 h-4 text-[#6554F0] rounded cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D] mb-2.5">Analysis Depth</h3>
              <div className="flex gap-2">
                {['standard', 'deep', 'exhaustive'].map(depth => (
                  <button
                    type="button"
                    key={depth}
                    onClick={() => setAstDepth(depth)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold capitalize border cursor-pointer transition-all ${
                      astDepth === depth ? 'bg-[#F0EDFF] border-[#6554F0] text-[#6554F0]' : 'bg-white border-[#E7E9F3] text-[#77819D]'
                    }`}
                  >
                    {depth} AST
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D]">CI/CD & Source Integrations</h3>
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#E7E9F3] bg-[#F7F8FC]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">GH</div>
                <div>
                  <div className="font-bold text-xs text-[#18213D]">GitHub Actions Security Gate</div>
                  <div className="text-[10px] text-[#77819D]">Automated PR checks on repository push</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#16B887]/15 text-[#16B887] font-semibold text-[10px]">Enabled</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          {saved ? (
            <span className="text-xs font-semibold text-[#16B887] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Configuration updated successfully
            </span>
          ) : <div />}

          <div className="flex items-center gap-2">
            {onRunScan && (
              <button
                type="button"
                onClick={() => onRunScan(baseUrl)}
                className="px-4 py-2 rounded-xl bg-white border border-[#6554F0] text-[#6554F0] hover:bg-[#F0EDFF] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <Play className="w-3 h-3 fill-[#6554F0]" /> Run Scan on Target
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
