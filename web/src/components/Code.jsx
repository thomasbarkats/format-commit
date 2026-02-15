import { useState } from 'react';
import { Copy, Check } from 'lucide-react';


export default function Code({ children, lang }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-t-lg px-4 py-2">
        {lang && (
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-mono">
            {lang}
          </span>
        )}
        <button
          onClick={copy}
          className="text-slate-600 hover:text-slate-300 transition-colors cursor-pointer ml-auto"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="bg-[var(--color-surface)] border border-t-0 border-[var(--color-border)] rounded-b-lg p-4 overflow-x-auto">
        <code className="font-mono text-sm text-slate-300 leading-relaxed">
          {children}
        </code>
      </pre>
    </div>
  );
}
