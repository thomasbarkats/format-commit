import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';


export default function CommitShowcase({ badCommits, goodFormats }) {
  const [formatIndex, setFormatIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setFormatIndex((i) => (i + 1) % goodFormats.length);
        setFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = goodFormats[formatIndex];

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 glow overflow-hidden">
      {/* Terminal bar */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-3 h-3 rounded-full bg-red-500/60" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <div className="w-3 h-3 rounded-full bg-green-500/60" />
        <span className="ml-3 text-xs text-slate-600 font-mono">git log</span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[10rem_auto] md:gap-10 md:justify-center mb-4">
        {/* Bad commits */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <X size={14} className="text-red-400 shrink-0" />
            <span className="text-xs uppercase tracking-wider text-red-400/80 font-semibold">Before</span>
          </div>
          <div className="space-y-2">
            {badCommits.map((msg, i) => (
              <div key={i} className="flex items-center gap-2.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-red-500/40 shrink-0" />
                <code className="font-mono text-sm text-slate-600 line-through decoration-red-500/30 whitespace-nowrap">
                  {msg}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Good commits */}
        <div className="min-w-0" style={{ maskImage: 'linear-gradient(to right, black calc(100% - 2rem), transparent)', WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 2rem), transparent)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Check size={14} className="text-[var(--color-accent-light)] shrink-0" />
            <span className="text-xs uppercase tracking-wider text-[var(--color-accent-light)]/80 font-semibold">After</span>
          </div>
          <div className="relative">
            {/* Hidden: all formats stacked to reserve max height */}
            {goodFormats.map((fmt, fi) => (
              <div key={fi} className={`space-y-2 ${fi === 0 ? '' : 'absolute inset-0'}`} style={{ visibility: 'hidden' }}>
                {fmt.commits.map((msg, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full shrink-0" />
                    <code className="font-mono text-sm whitespace-nowrap">{msg}</code>
                  </div>
                ))}
              </div>
            ))}
            {/* Visible: current format */}
            <div
              className={`absolute inset-0 space-y-2 transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
            >
              {current.commits.map((msg, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]/60 shrink-0" />
                  <code className="font-mono text-sm text-slate-300 whitespace-nowrap">{msg}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
