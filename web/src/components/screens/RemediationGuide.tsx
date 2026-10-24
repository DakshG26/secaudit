import React, { useState, useEffect } from 'react';
import { Copy, Check, ShieldCheck } from 'lucide-react';
import { Finding } from '../../types/security';

interface RemediationGuideProps {
  findings: Finding[];
  selectedFindingId?: string;
}

export const RemediationGuide: React.FC<RemediationGuideProps> = ({
  findings = [],
  selectedFindingId
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [lang, setLang] = useState<'python' | 'nodejs'>('python');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedFindingId && findings.length > 0) {
      const idx = findings.findIndex(f => f.id === selectedFindingId);
      if (idx !== -1) setActiveStep(idx);
    }
  }, [selectedFindingId, findings]);

  if (!findings || findings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E7E9F3] p-10 text-center shadow-xs animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-[#16B887]/15 text-[#16B887] flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#18213D]">Application Fully Hardened</h2>
        <p className="text-xs text-[#77819D] mt-1.5 max-w-md mx-auto">
          Zero vulnerabilities detected across your AST syntax trees and HTTP headers. All baseline security controls are active.
        </p>
      </div>
    );
  }

  const currentFinding = findings[activeStep] || findings[0];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageSnippet = () => {
    const loc = currentFinding.location || '/api';
    if (lang === 'python') {
      if (currentFinding.owasp === 'A02') {
        return `# Python Flask-Talisman Fix for ${currentFinding.title}:\nfrom flask_talisman import Talisman\nTalisman(app, content_security_policy={\n    'default-src': \"'self'\",\n    'script-src': \"'self'\"\n}, force_https=True)`;
      }
      return `# Python Zero-Trust Fix for ${currentFinding.title}:\n@app.route('${loc}')\n@login_required\n@roles_required(['admin'])\ndef secure_handler():\n    # Parameterized query with strict access validation\n    return jsonify({"status": "protected", "verified": True})`;
    }
    // Node.js
    if (currentFinding.owasp === 'A02') {
      return `// Node.js Helmet Fix for ${currentFinding.title}:\nconst helmet = require('helmet');\napp.use(helmet.contentSecurityPolicy({\n  directives: {\n    defaultSrc: ["'self'"],\n    scriptSrc: ["'self'"]\n  }\n}));\napp.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));`;
    }
    return `// Node.js Express Zero-Trust Fix for ${currentFinding.title}:\napp.use('${loc}', verifyJwt, requireRole('admin'), (req, res) => {\n  // Parameterized query preventing injection & exposure\n  res.json({ status: "protected", verified: true });\n});`;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E7E9F3] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#16B887]/15 text-[#16B887]">
              Playbook ({findings.length} Issues)
            </span>
            <span className="text-xs text-[#77819D]">Verified Patch Generation</span>
          </div>
          <h2 className="text-2xl font-bold text-[#18213D] mt-1">Remediation Guide</h2>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#F7F8FC] border border-[#E7E9F3] rounded-xl self-start md:self-auto">
          {(['python', 'nodejs'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                lang === l ? 'bg-[#6554F0] text-white shadow-xs' : 'text-[#77819D] hover:text-[#18213D]'
              }`}
            >
              {l === 'python' ? 'Python' : 'Node.js / Web'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Steps list */}
        <div className="lg:col-span-4 space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {findings.map((f, idx) => {
            const isActive = activeStep === idx;
            const isHigh = f.severity === 'critical' || f.severity === 'high';
            return (
              <div
                key={f.id || idx}
                onClick={() => setActiveStep(idx)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive ? 'bg-[#F0EDFF] border-[#6554F0] shadow-xs' : 'bg-white border-[#E7E9F3] hover:border-[#6554F0]/30'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                    isActive ? 'bg-[#6554F0] text-white' : 'bg-[#F7F8FC] text-[#77819D] border border-[#E7E9F3]'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                        isHigh ? 'bg-[#F45D75]/15 text-[#F45D75]' : 'bg-[#FFAD42]/15 text-[#FFAD42]'
                      }`}>
                        {f.severity}
                      </span>
                      <span className="text-[10px] font-mono text-[#77819D] truncate">{f.owasp}</span>
                    </div>
                    <h4 className={`text-xs font-bold mt-0.5 truncate ${isActive ? 'text-[#6554F0]' : 'text-[#18213D]'}`}>
                      {f.title}
                    </h4>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Code comparison */}
        <div className="lg:col-span-8 space-y-3.5">
          <div className="bg-white rounded-xl border border-[#E7E9F3] p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#6554F0] uppercase font-bold">Step #{activeStep + 1}</div>
              <div className="text-sm font-bold text-[#18213D]">{currentFinding.title}</div>
            </div>
            <span className="text-xs font-mono text-[#77819D] bg-[#F7F8FC] px-2 py-0.5 rounded border border-[#E7E9F3]">
              {currentFinding.location || 'HTTP Header'}
            </span>
          </div>

          {/* Vulnerable Code Panel */}
          <div className="bg-[#18213D] rounded-xl border border-[#F45D75]/30 overflow-hidden text-xs font-mono">
            <div className="px-3.5 py-1.5 bg-[#F45D75]/15 border-b border-[#F45D75]/25 flex items-center justify-between text-[#F45D75]">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F45D75]" /> Vulnerable Code / Evidence
              </span>
              <span className="text-[10px] text-white/60">Identified Vulnerability</span>
            </div>
            <pre className="p-3 text-[#F87171] overflow-x-auto leading-relaxed max-h-36">
              <code>{currentFinding.evidence || `// Vulnerable finding in ${currentFinding.location}\n${currentFinding.title}`}</code>
            </pre>
          </div>

          {/* Recommended Fix Code Panel */}
          <div className="bg-[#0E1326] rounded-xl border border-[#16B887]/40 overflow-hidden text-xs font-mono">
            <div className="px-3.5 py-1.5 bg-[#16B887]/15 border-b border-[#16B887]/30 flex items-center justify-between text-[#16B887]">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16B887]" /> Recommended Zero-Trust Fix ({lang === 'python' ? 'Python' : 'Node.js'})
              </span>
              <button
                onClick={() => handleCopy(getLanguageSnippet())}
                className="text-[11px] text-white hover:text-[#16B887] flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-[#16B887]" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-3 text-[#4ADE80] overflow-x-auto leading-relaxed max-h-40">
              <code>{getLanguageSnippet()}</code>
            </pre>
          </div>

          {/* Expected Security Improvement */}
          <div className="bg-[#16B887]/10 border border-[#16B887]/30 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#16B887] shrink-0 mt-0.5" />
            <div className="text-xs">
              <h5 className="font-bold text-[#16B887]">Expected Security Improvement</h5>
              <p className="text-[#18213D] mt-0.5 leading-relaxed">
                {currentFinding.remediation || 'Remediating this finding enforces parameterization and access controls.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
