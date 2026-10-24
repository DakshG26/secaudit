import React, { useState } from 'react';
import { 
  Check
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'scan' | 'integrations'>('scan');
  const [baseUrl, setBaseUrl] = useState('http://localhost:5000');
  const [appName, setAppName] = useState('AI Web App (Staging)');
  const [astDepth, setAstDepth] = useState('deep');
  const [saved, setSaved] = useState(false);

  // Toggles
  const [toggles, setToggles] = useState({
    owaspA01: true,
    owaspA02: true,
    owaspA04: true,
    owaspA05: true,
    owaspA10: true,
    nonDestructiveProbes: true,
    aiModelVerification: true,
    autoRemediateSnippets: true,
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
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E7E9F3] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6554F0]" />
            <span className="text-xs font-semibold text-[#6554F0] uppercase tracking-wider">Preferences</span>
          </div>
          <h2 className="text-2xl font-bold text-[#18213D] mt-1">Audit Engine Settings</h2>
          <p className="text-xs text-[#77819D]">
            Configure static analysis parameters, OWASP rule filters, and target deployment URLs.
          </p>
        </div>

        {/* Tab switch */}
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

      <form onSubmit={handleSave} className="space-y-5">
        {activeTab === 'general' && (
          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D]">General Information</h3>
            <div>
              <label className="block text-xs font-semibold text-[#18213D] mb-1">Application Name</label>
              <input
                type="text"
                value={appName}
                onChange={e => setAppName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#F7F8FC] border border-[#E7E9F3] rounded-xl text-[#18213D] focus:outline-none focus:border-[#6554F0]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#18213D] mb-1">Base Target URL / Localhost Port</label>
              <input
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#F7F8FC] border border-[#E7E9F3] rounded-xl text-[#18213D] focus:outline-none focus:border-[#6554F0]"
              />
            </div>
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D] mb-3">OWASP Top 10 Checks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'owaspA01' as const, label: 'A01: Broken Access Control (Decorators, IDOR)' },
                  { key: 'owaspA02' as const, label: 'A02: Security Misconfiguration (Debug mode, CORS)' },
                  { key: 'owaspA04' as const, label: 'A04: Cryptographic Failures (Hardcoded keys, JWT)' },
                  { key: 'owaspA05' as const, label: 'A05: Injection (SQL, eval/exec remote commands)' },
                  { key: 'owaspA10' as const, label: 'A10: Sensitive Information Leaks (Stack traces)' },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8FC] border border-[#E7E9F3] cursor-pointer hover:border-[#6554F0]/30 transition-all">
                    <span className="text-xs font-medium text-[#18213D] pr-2">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={toggles[item.key]}
                      onChange={() => handleToggle(item.key)}
                      className="w-4 h-4 text-[#6554F0] rounded focus:ring-0 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D] mb-3">Analysis Depth</h3>
              <div className="flex gap-3">
                {['standard', 'deep', 'exhaustive'].map(depth => (
                  <button
                    type="button"
                    key={depth}
                    onClick={() => setAstDepth(depth)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold capitalize border cursor-pointer transition-all ${
                      astDepth === depth
                        ? 'bg-[#F0EDFF] border-[#6554F0] text-[#6554F0]'
                        : 'bg-white border-[#E7E9F3] text-[#77819D] hover:text-[#18213D]'
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
          <div className="bg-white rounded-2xl border border-[#E7E9F3] p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#77819D]">CI/CD & Source Integrations</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E7E9F3] bg-[#F7F8FC]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">GH</div>
                  <div>
                    <div className="font-bold text-[#18213D]">GitHub Actions Security Gate</div>
                    <div className="text-[11px] text-[#77819D]">Fail PR builds when critical findings exist</div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-[#16B887]/15 text-[#16B887] font-semibold text-[11px]">Enabled</span>
              </div>
            </div>
          </div>
        )}

        {/* Save Changes button with feedback */}
        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-xs font-semibold text-[#16B887] flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" /> Configuration saved successfully
            </span>
          ) : <div />}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6554F0] to-[#342D8C] text-white text-xs font-semibold shadow-md shadow-[#6554F0]/25 hover:shadow-lg transition-all cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
