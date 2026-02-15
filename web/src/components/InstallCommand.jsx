import { useState, useRef, useEffect } from 'react';
import { Terminal, ChevronDown, Copy, Check } from 'lucide-react';


export default function InstallCommand({ packageManagers }) {
  const [pm, setPm] = useState(packageManagers[0]);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {setOpen(false);}
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(pm.full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative inline-flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl font-mono text-sm max-w-full whitespace-nowrap">
      <div ref={ref} className="relative shrink-0">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-4 py-3.5 text-[var(--color-accent-light)] hover:text-[var(--color-accent)] transition-colors cursor-pointer border-r border-[var(--color-border)]"
        >
          <Terminal size={15} className="shrink-0" />
          <span className="text-sm font-medium">{pm.label}</span>
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1.5 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden z-50 min-w-[100px] flex flex-col">
            {packageManagers.map((p) => (
              <button
                key={p.id}
                onClick={() => { setPm(p); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                  p.id === pm.id
                    ? 'text-[var(--color-accent-light)] bg-[var(--color-accent)]/10'
                    : 'text-slate-400 hover:text-white hover:bg-[var(--color-surface)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <span className="text-slate-300 px-4 py-3.5 min-w-0 overflow-hidden text-ellipsis">{pm.command}</span>
      <button
        onClick={copy}
        className="pr-4 pl-2 text-slate-500 hover:text-white transition-colors cursor-pointer shrink-0"
        title="Copy"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  );
}
