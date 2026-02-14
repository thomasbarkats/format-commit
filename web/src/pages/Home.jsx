import { Link } from "react-router-dom";
import {
  GitCommitVertical,
  GitBranch,
  Sparkles,
  Settings,
  Shield,
  Zap,
  Copy,
  Check,
  Terminal,
  ChevronDown,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const packageManagers = [
  { id: "npm", label: "npm", command: "i format-commit --save-dev", full: "npm i format-commit --save-dev" },
  { id: "pnpm", label: "pnpm", command: "add -D format-commit", full: "pnpm add -D format-commit" },
  { id: "yarn", label: "yarn", command: "add -D format-commit", full: "yarn add -D format-commit" },
  { id: "bun", label: "bun", command: "add -d format-commit", full: "bun add -d format-commit" },
];

function InstallCommand() {
  const [pm, setPm] = useState(packageManagers[0]);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
          <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1.5 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden z-50 min-w-[100px] flex flex-col">
            {packageManagers.map((p) => (
              <button
                key={p.id}
                onClick={() => { setPm(p); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                  p.id === pm.id
                    ? "text-[var(--color-accent-light)] bg-[var(--color-accent)]/10"
                    : "text-slate-400 hover:text-white hover:bg-[var(--color-surface)]"
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

// Bad commits (messy)
const badCommits = [
  "fixed stuff",
  "update code",
  "wip changes",
];

// Good commit format sets that rotate
const goodFormats = [
  {
    label: "Scoped",
    commits: [
      "fix(auth) Resolve token refresh loop",
      "feat(ui) Add dark mode toggle",
      "core(api) Migrate to REST v3 endpoints",
    ],
  },
  {
    label: "Conventional",
    commits: [
      "fix: Resolve token refresh loop",
      "feat: Add dark mode toggle",
      "core: Migrate to REST v3 endpoints",
    ],
  },
  {
    label: "Custom",
    commits: [
      "[EPIC-042] fix - auth - Resolve token refresh loop",
      "[EPIC-108] feat - ui - Add dark mode toggle",
      "[EPIC-077] core - api - Migrate to REST v3 endpoints",
    ],
  },
  {
    label: "Parenthesized",
    commits: [
      "(fix) Resolve token refresh loop",
      "(feat) Add dark mode toggle",
      "(core) Migrate to REST v3 endpoints",
    ],
  },
];

function CommitShowcase() {
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
        <div className="min-w-0" style={{ maskImage: "linear-gradient(to right, black calc(100% - 2rem), transparent)", WebkitMaskImage: "linear-gradient(to right, black calc(100% - 2rem), transparent)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Check size={14} className="text-[var(--color-accent-light)] shrink-0" />
            <span className="text-xs uppercase tracking-wider text-[var(--color-accent-light)]/80 font-semibold">After</span>
          </div>
          <div className="relative">
            {/* Hidden: all formats stacked to reserve max height */}
            {goodFormats.map((fmt, fi) => (
              <div key={fi} className={`space-y-2 ${fi === 0 ? "" : "absolute inset-0"}`} style={{ visibility: "hidden" }}>
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
              className={`absolute inset-0 space-y-2 transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}
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

const features = [
  {
    icon: GitCommitVertical,
    title: "Standardized commits",
    desc: "Enforce consistent commit messages across your team with 8+ built-in formats or your own custom pattern.",
  },
  {
    icon: GitBranch,
    title: "Branch naming",
    desc: "Create well-structured branch names that follow your conventions. Built-in or custom formats.",
  },
  {
    icon: Sparkles,
    title: "AI suggestions",
    desc: "Let Claude, GPT, or Gemini analyze your staged changes and suggest commit titles that match your format.",
  },
  {
    icon: Settings,
    title: "Fully configurable",
    desc: "Types, scopes, length constraints, version bumps, custom fields — everything adapts to your workflow.",
  },
  {
    icon: Zap,
    title: "Lightweight",
    desc: "Only 3 runtime dependencies. No framework overhead, no background processes — just a fast CLI.",
  },
  {
    icon: Shield,
    title: "Safe by design",
    desc: "API keys stay in your local .env (auto-added to .gitignore). Test mode lets you preview without executing.",
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
            Stop writing{" "}
            <span className="gradient-text">messy commits</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A lightweight CLI that standardizes your commit messages and branch
            names - with optional <span className="font-semibold">AI to do the thinking for you</span>.
          </p>

          <InstallCommand />
        </div>
      </section>

      {/* Commit showcase */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <CommitShowcase />
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
