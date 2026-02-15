export default function ConfigOption({ name, description, options, example }) {
  return (
    <div className="border-b border-[var(--color-border)]/50 pb-6 last:border-0">
      <h3 className="font-mono text-sm font-medium text-[var(--color-accent-light)] mb-2">
        {name}
      </h3>
      <p className="text-sm text-slate-400 mb-2">{description}</p>
      {options && (
        <div className="mt-3 space-y-1">
          {options.map((o) => (
            <div key={o.value} className="flex items-baseline gap-3 text-sm">
              <code className="font-mono text-xs text-slate-500 shrink-0">
                {o.value}
              </code>
              <span className="text-slate-400">{o.label}</span>
            </div>
          ))}
        </div>
      )}
      {example && (
        <div className="mt-2">
          <span className="text-xs text-slate-600">Example: </span>
          <code className="font-mono text-sm text-slate-400">{example}</code>
        </div>
      )}
    </div>
  );
}
