import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Cpu, Lock, CheckCircle2 } from 'lucide-react';

interface CountUpProps {
  end: number;
  suffix?: string;
  duration?: number;
}

const CountUp: React.FC<CountUpProps> = ({ end, suffix = '', duration = 1800 }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const frame = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3); // cubic ease out
          setVal(Math.floor(ease * end));
          if (progress < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{val}{suffix}</span>;
};

export const Pillars: React.FC = () => {
  return (
    <section className="py-16 border-y border-slate-900 bg-[#050811] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {/* Pillar 1 */}
          <div className="p-4">
            <div className="flex items-center justify-center mb-3">
              <span className="p-2.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                <Cpu className="w-5 h-5" />
              </span>
            </div>
            <div className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
              <CountUp end={21} />
            </div>
            <p className="mt-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              Data-Driven Rules
            </p>
            <p className="text-[11px] text-slate-500 mt-1">YAML rule definitions</p>
          </div>

          {/* Pillar 2 */}
          <div className="p-4">
            <div className="flex items-center justify-center mb-3">
              <span className="p-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
            </div>
            <div className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
              <CountUp end={100} suffix="%" />
            </div>
            <p className="mt-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              Read-Only AST
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Zero code execution</p>
          </div>

          {/* Pillar 3 */}
          <div className="p-4">
            <div className="flex items-center justify-center mb-3">
              <span className="p-2.5 rounded-2xl bg-blue-950/60 border border-blue-500/30 text-blue-400">
                <Lock className="w-5 h-5" />
              </span>
            </div>
            <div className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
              <CountUp end={0} />
            </div>
            <p className="mt-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              Destructive Probes
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Localhost only guards</p>
          </div>

          {/* Pillar 4 */}
          <div className="p-4">
            <div className="flex items-center justify-center mb-3">
              <span className="p-2.5 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-purple-400">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            </div>
            <div className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
              <CountUp end={7} />
            </div>
            <p className="mt-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              OWASP 2025 Pillars
            </p>
            <p className="text-[11px] text-slate-500 mt-1">CWE mapped taxonomy</p>
          </div>
        </div>
      </div>
    </section>
  );
};
