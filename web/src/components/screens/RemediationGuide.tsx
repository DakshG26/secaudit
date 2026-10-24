import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ShieldCheck
} from 'lucide-react';
import { Finding } from '../../types/security';

interface RemediationGuideProps {
  findings: Finding[];
  selectedFindingId?: string;
}

export const RemediationGuide: React.FC<RemediationGuideProps> = ({
  findings
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [lang, setLang] = useState<'python' | 'nodejs'>('python');
  const [copied, setCopied] = useState(false);

  const steps = [
    { title: 'Add Authentication', desc: 'Attach session or JWT authentication decorators to handler' },
    { title: 'Enforce Authorization', desc: 'Verify caller permissions and tenant resource ownership' },
    { title: 'Validate Input', desc: 'Replace dynamic interpolation with parameterized bindings' },
    { title: 'Configure Security Headers', desc: 'Set CSP, HSTS, X-Content-Type-Options and CORS allowlist' },
    { title: 'Retest Endpoint', desc: 'Run automated regression scan to verify fix before merging' },
  ];

  const currentFinding = findings[activeStep] || findings[0];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleVulnerableCode = lang === 'python' 
    ? `@app.route('/admin')\ndef admin_panel():\n    # Vulnerable: missing @login_required\n    query = f"SELECT * FROM users WHERE role='{request.args.get('r')}'"\n    return db.execute(query).fetchall()`
    : `app.get('/admin', async (req, res) => {\n  // Vulnerable: no auth middleware\n  const query = \`SELECT * FROM users WHERE role = '\${req.query.r}'\`;\n  return res.json(await db.query(query));\n});`;

  const sampleFixedCode = lang === 'python'
    ? `@app.route('/admin')\n@login_required\n@roles_required('admin')\ndef admin_panel():\n    # Hardened: parameterized prepared statement\n    query = "SELECT * FROM users WHERE role = %s"\n    return db.execute(query, (request.args.get('r'),)).fetchall()`
    : `app.get('/admin', verifyJwt, requireRole('admin'), async (req, res) => {\n  // Hardened: parameterized prepared statement\n  const query = 'SELECT * FROM users WHERE role = $1';\n  return res.json(await db.query(query, [req.query.r]));\n});`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E7E9F3] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#16B887]/15 text-[#16B887]">
              Step-by-Step Playbook
            </span>
            <span className="text-xs text-[#77819D]">Automated Patch Generation</span>
          </div>
          <h2 className="text-2xl font-bold text-[#18213D] mt-1">Remediation Guide</h2>
          <p className="text-xs text-[#77819D]">
            Fix identified security gaps with verified zero-trust code snippets and verify them before deployment.
          </p>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#F7F8FC] border border-[#E7E9F3] rounded-xl self-start md:self-auto">
          <button
            onClick={() => setLang('python')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              lang === 'python' ? 'bg-[#6554F0] text-white shadow-xs' : 'text-[#77819D] hover:text-[#18213D]'
            }`}
          >
            Python (Flask/FastAPI)
          </button>
          <button
            onClick={() => setLang('nodejs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              lang === 'nodejs' ? 'bg-[#6554F0] text-white shadow-xs' : 'text-[#77819D] hover:text-[#18213D]'
            }`}
          >
            Node.js (Express)
          </button>
        </div>
      </div>

      {/* Main Grid: Steps list on left, Code Diff on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Numbered Steps */}
        <div className="lg:col-span-4 space-y-3">
          {steps.map((s, idx) => {
            const isActive = activeStep === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#F0EDFF] border-[#6554F0] shadow-sm'
                    : 'bg-white border-[#E7E9F3] hover:border-[#6554F0]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isActive ? 'bg-[#6554F0] text-white' : 'bg-[#F7F8FC] text-[#77819D] border border-[#E7E9F3]'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-xs font-bold ${isActive ? 'text-[#6554F0]' : 'text-[#18213D]'}`}>
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-[#77819D] mt-0.5 line-clamp-1">{s.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Code comparison & Success Panel */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Target Banner */}
          <div className="bg-white rounded-xl border border-[#E7E9F3] p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-[#6554F0] uppercase font-bold">Current Action Item</div>
              <div className="text-sm font-bold text-[#18213D]">{steps[activeStep].title}</div>
            </div>
            <span className="text-xs font-mono text-[#77819D] bg-[#F7F8FC] px-2.5 py-1 rounded-lg border border-[#E7E9F3]">
              {currentFinding?.location || 'app.py:52'}
            </span>
          </div>

          {/* Vulnerable Code Panel */}
          <div className="bg-[#18213D] rounded-xl border border-[#F45D75]/30 overflow-hidden text-xs font-mono">
            <div className="px-4 py-2 bg-[#F45D75]/15 border-b border-[#F45D75]/25 flex items-center justify-between text-[#F45D75]">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F45D75]" /> Vulnerable Code
              </span>
              <span className="text-[10px] text-white/60">Do not deploy</span>
            </div>
            <pre className="p-4 text-[#F87171] overflow-x-auto leading-relaxed">
              <code>{currentFinding?.evidence ? `# Location: ${currentFinding.location}\n${currentFinding.evidence}` : sampleVulnerableCode}</code>
            </pre>
          </div>

          {/* Recommended Fix Code Panel */}
          <div className="bg-[#0E1326] rounded-xl border border-[#16B887]/40 overflow-hidden text-xs font-mono">
            <div className="px-4 py-2 bg-[#16B887]/15 border-b border-[#16B887]/30 flex items-center justify-between text-[#16B887]">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16B887]" /> Recommended Zero-Trust Fix
              </span>
              <button
                onClick={() => handleCopy(currentFinding?.fixed_code || sampleFixedCode)}
                className="text-[11px] text-white hover:text-[#16B887] flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#16B887]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 text-[#4ADE80] overflow-x-auto leading-relaxed">
              <code>{currentFinding?.fixed_code || sampleFixedCode}</code>
            </pre>
          </div>

          {/* Expected Security Improvement (Green Success Panel) */}
          <div className="bg-[#16B887]/10 border border-[#16B887]/30 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#16B887] shrink-0 mt-0.5" />
            <div className="text-xs">
              <h5 className="font-bold text-[#16B887]">Expected Security Improvement</h5>
              <p className="text-[#18213D] mt-1 leading-relaxed">
                Applying this fix ensures mandatory authentication check and parameter binding prior to handler execution. Unauthenticated calls will be rejected with HTTP 401/403, and SQL injection syntax will be treated purely as literal string values.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
