import { Link } from 'react-router-dom';
import {
  GitCommitVertical,
  GitBranch,
  Sparkles,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';
import InstallCommand from '../components/InstallCommand';
import CommitShowcase from '../components/CommitShowcase';


const packageManagers = [
  { id: 'npm', label: 'npm', command: 'i format-commit --save-dev', full: 'npm i format-commit --save-dev' },
  { id: 'pnpm', label: 'pnpm', command: 'add -D format-commit', full: 'pnpm add -D format-commit' },
  { id: 'yarn', label: 'yarn', command: 'add -D format-commit', full: 'yarn add -D format-commit' },
  { id: 'bun', label: 'bun', command: 'add -d format-commit', full: 'bun add -d format-commit' },
];

// Bad commits (messy)
const badCommits = [
  'fixed stuff',
  'update code',
  'wip changes',
];

// Good commit format sets that rotate
const goodFormats = [
  {
    label: 'Scoped',
    commits: [
      'fix(auth) Resolve token refresh loop',
      'feat(ui) Add dark mode toggle',
      'core(api) Migrate to REST v3 endpoints',
    ],
  },
  {
    label: 'Conventional',
    commits: [
      'fix: Resolve token refresh loop',
      'feat: Add dark mode toggle',
      'core: Migrate to REST v3 endpoints',
    ],
  },
  {
    label: 'Custom',
    commits: [
      '[EPIC-042] fix - auth - Resolve token refresh loop',
      '[EPIC-108] feat - ui - Add dark mode toggle',
      '[EPIC-077] core - api - Migrate to REST v3 endpoints',
    ],
  },
  {
    label: 'Parenthesized',
    commits: [
      '(fix) Resolve token refresh loop',
      '(feat) Add dark mode toggle',
      '(core) Migrate to REST v3 endpoints',
    ],
  },
];

const features = [
  {
    icon: GitCommitVertical,
    title: 'Standardized commits',
    desc: 'Enforce consistent commit messages across your team with 8+ built-in formats or your own custom pattern.',
  },
  {
    icon: GitBranch,
    title: 'Branch naming',
    desc: 'Create well-structured branch names that follow your conventions. Built-in or custom formats.',
  },
  {
    icon: Sparkles,
    title: 'AI suggestions',
    desc: 'Let Claude, GPT, or Gemini analyze your staged changes and suggest commit titles that match your format.',
  },
  {
    icon: Settings,
    title: 'Fully configurable',
    desc: 'Types, scopes, length constraints, version bumps, custom fields — everything adapts to your workflow.',
  },
  {
    icon: Zap,
    title: 'Lightweight',
    desc: 'Only 3 runtime dependencies. No framework overhead, no background processes — just a fast CLI.',
  },
  {
    icon: Shield,
    title: 'Safe by design',
    desc: 'API keys stay in your local .env (auto-added to .gitignore). Test mode lets you preview without executing.',
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(22,163,74,0.08)_0%,transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto px-6 pt-22 pb-12 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Stop writing{' '}
            <span className="gradient-text">messy commits</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A lightweight CLI that standardizes your commit messages and branch
            names - with optional <span className="font-semibold">AI to do the thinking for you</span>.
          </p>

          <InstallCommand packageManagers={packageManagers} />
        </div>
      </section>

      {/* Commit showcase */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <CommitShowcase badCommits={badCommits} goodFormats={goodFormats} />
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20 flex justify-center">
        <Link
          to="/docs"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 hover:border-[var(--color-accent)]/50 text-[var(--color-accent-light)] hover:text-white rounded-lg transition-colors font-medium text-sm cursor-pointer"
        >
          Read the docs →
        </Link>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="border-t border-[var(--color-border)]" />
      </div>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Everything you need, nothing you don't
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            Built for developers who want clean Git history without the overhead
            of heavy tooling.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 hover:border-[var(--color-border-light)] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
                <f.icon
                  size={20}
                  className="text-[var(--color-accent-light)]"
                />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
