import React, { useEffect, useState } from 'react';
import { Search, Loader2, Play, Sparkles, FolderCode, Globe } from 'lucide-react';

interface ScanInputProps {
  onScan: (url: string) => void;
  isLoading: boolean;
  activeTarget: string;
}

const SAMPLE_TARGETS = new Set(['sample:vulnerable', 'sample:clean']);
const GITHUB_SHORTHAND = /^[\w.-]+\/[\w.-]+(?:\.git)?$/;
const GITHUB_HOST_TARGET = /^(?:https?:\/\/)?(?:www\.)?github\.com\/[^/\s]+\/[^/\s]+(?:\/[^\s]*)?$/i;

const isValidTarget = (value: string): boolean => {
  if (SAMPLE_TARGETS.has(value) || GITHUB_SHORTHAND.test(value) || GITHUB_HOST_TARGET.test(value)) {
    return true;
  }

  const hasProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(value);
  const candidate = hasProtocol ? value : `https://${value}`;

  try {
    const parsed = new URL(candidate);
    const isHttpUrl = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    const isBareHost = !hasProtocol && !value.includes('/');
    const hasRecognizableHost = parsed.hostname === 'localhost' || parsed.hostname.includes('.');
    return isHttpUrl && Boolean(parsed.hostname) && (!isBareHost || hasRecognizableHost);
  } catch {
    return false;
  }
};

export const ScanInput: React.FC<ScanInputProps> = ({ onScan, isLoading, activeTarget = '' }) => {
  const [inputVal, setInputVal] = useState(activeTarget);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    setInputVal(activeTarget);
    setValidationMessage('');
  }, [activeTarget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const target = inputVal.trim();
    if (!target) {
      setValidationMessage('Enter a URL, GitHub repository, or sample target.');
      return;
    }
    if (!isValidTarget(target)) {
      setValidationMessage('Use a valid http(s) URL, GitHub owner/repo, or one of the sample targets.');
      return;
    }

    setValidationMessage('');
    onScan(target);
  };

  const handlePreset = (val: string) => {
    if (isLoading) return;
    setInputVal(val);
    setValidationMessage('');
    onScan(val);
  };

  const hasValidationError = Boolean(validationMessage);

  return (
    <div className="w-full max-w-3xl mx-auto my-6">
      <form onSubmit={handleSubmit} className="relative group" noValidate aria-busy={isLoading}>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-emerald-500/20 blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
        
        <div className="relative flex flex-col sm:flex-row items-stretch gap-2 p-2 bg-[#0c1322] border border-cyan-500/30 rounded-xl shadow-2xl">
          <div className="relative flex-1 flex items-center pl-3">
            <Search className="w-5 h-5 text-cyan-400/80 mr-2 shrink-0" />
            <input
              id="scan-target"
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                if (hasValidationError) setValidationMessage('');
              }}
              placeholder="Paste GitHub URL (e.g. https://github.com/org/repo) or choose preset"
              disabled={isLoading}
              aria-label="Scan target URL or repository"
              aria-invalid={hasValidationError}
              aria-describedby={hasValidationError ? 'scan-target-error' : undefined}
              autoComplete="url"
              spellCheck={false}
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 rounded font-mono py-2 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            aria-label={isLoading ? 'Scan in progress' : 'Audit scan target'}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1322] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-blue-600 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Auditing AST...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Audit Target</span>
              </>
            )}
          </button>
        </div>
      </form>

      {hasValidationError && (
        <p id="scan-target-error" role="alert" className="mt-2 px-1 text-xs text-red-300">
          {validationMessage}
        </p>
      )}

      {/* Quick preset chips */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-slate-500 font-mono">Sample targets:</span>
        <button
          type="button"
          onClick={() => handlePreset('sample:vulnerable')}
          disabled={isLoading}
          aria-label="Scan vulnerable AI Flask sample"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/50 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FolderCode className="w-3 h-3 text-red-400" />
          <span>Vulnerable AI Flask App (12 Flaws)</span>
        </button>
        <button
          type="button"
          onClick={() => handlePreset('sample:clean')}
          disabled={isLoading}
          aria-label="Scan patched app sample"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Patched App (Zero Flaws)</span>
        </button>
        <button
          type="button"
          onClick={() => handlePreset('https://github.com/bottlepy/bottle')}
          disabled={isLoading}
          aria-label="Scan bottle GitHub repository"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-700 text-slate-300 hover:border-cyan-500/50 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Globe className="w-3 h-3 text-cyan-400" />
          <span>Real GitHub Repo (bottle)</span>
        </button>
      </div>

      {/* Loading Progress ticker */}
      {isLoading && (
        <div className="mt-5 p-3 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>AST route extraction & OWASP 2025 rule matching in progress...</span>
          </div>
          <span className="text-slate-400">Non-destructive</span>
        </div>
      )}
    </div>
  );
};
