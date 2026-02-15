export default function InlineCode({ children }) {
  return (
    <code className="font-mono text-sm bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-accent-light)] px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}
