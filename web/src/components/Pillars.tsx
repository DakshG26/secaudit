import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Cpu, Lock, CheckCircle2 } from 'lucide-react';

const CountUp: React.FC<{ end: number; suffix?: string }> = ({ end, suffix = '' }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const node = ref.current;
    let frameId: number | undefined;

    if (!node || typeof IntersectionObserver === 'undefined') {
      setVal(end);
      return;
    }

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVal(end);
      return;
    }

    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const start = performance.now();
        const dur = 1600;
        const tick = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          setVal(Math.floor((1 - Math.pow(1 - p, 3)) * end));
          if (p < 1) frameId = requestAnimationFrame(tick);
        };
        frameId = requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(node);
    return () => {
      obs.disconnect();
      if (frameId !== undefined) cancelAnimationFrame(frameId);
    };
  }, [end]);
  return <span ref={ref}>{val}{suffix}</span>;
};

export const Pillars: React.FC = () => (
  <section className="py-16 border-y border-divider bg-surface">
    <div className="max-w-7xl mx-auto px-6 sm:px-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8 text-center">
        {[
          { icon: Cpu,          val: 21,   suf: '',  label: 'Security Rules',     sub: 'YAML data-driven',  color: 'text-primary bg-primary/10 border-primary/20' },
          { icon: ShieldCheck,  val: 100,  suf: '%', label: 'Read-Only Analysis', sub: 'No code executed',   color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          { icon: Lock,         val: 0,    suf: '',  label: 'Destructive Probes', sub: 'localhost-only guard',color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { icon: CheckCircle2, val: 7,    suf: '',  label: 'OWASP Pillars',      sub: 'Top 10:2025',       color: 'text-purple-600 bg-purple-50 border-purple-200' },
        ].map(({ icon: Icon, val, suf, label, sub, color }) => (
          <div key={label} className="p-4">
            <span className={`inline-flex p-2.5 rounded-2xl border mb-3 ${color}`}>
              <Icon className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold font-display text-ink" aria-label={`${val}${suf} ${label}`}>
              <CountUp end={val} suffix={suf} />
            </div>
            <p className="mt-1 text-xs font-mono uppercase tracking-wider text-ink/80">{label}</p>
            <p className="text-xs text-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
