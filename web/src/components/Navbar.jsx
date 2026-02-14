import { Link, useLocation } from "react-router-dom";
import { Menu, X, Coffee, Github } from "lucide-react";
import { useState } from "react";

function NpmIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor">
      <rect width="256" height="256" rx="0" fill="currentColor" />
      <path d="M42.7 42.7h170.6v170.6H128V85.3H85.3v128H42.7z" fill="var(--color-bg)" />
    </svg>
  );
}

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const linkClass = (path) =>
    `text-sm font-medium transition-colors ${
      location.pathname === path
        ? "text-[var(--color-accent-light)]"
        : "text-slate-400 hover:text-white"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="text-[var(--color-accent-light)] font-mono font-bold text-sm">
            &gt;_
          </span>
          <span className="font-semibold text-white tracking-tight">
            format-commit
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={linkClass("/")}>
            Home
          </Link>
          <Link to="/docs" className={linkClass("/docs")}>
            Docs
          </Link>
          <a
            href="https://www.npmjs.com/package/format-commit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
            title="npm"
          >
            <NpmIcon size={20} />
          </a>
          <a
            href="https://github.com/thomasbarkats/format-commit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
            title="GitHub"
          >
            <Github size={20} />
          </a>
          <a
            href="https://buymeacoffee.com/thomasbrkts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
            title="Buy me a coffee"
          >
            <Coffee size={20} />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-slate-400 hover:text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-4 flex flex-col gap-4">
          <Link to="/" className={linkClass("/")} onClick={() => setOpen(false)}>
            Home
          </Link>
          <Link to="/docs" className={linkClass("/docs")} onClick={() => setOpen(false)}>
            Docs
          </Link>
          <a
            href="https://www.npmjs.com/package/format-commit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            npm
          </a>
          <a
            href="https://github.com/thomasbarkats/format-commit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://buymeacoffee.com/thomasbarkats"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Buy me a coffee
          </a>
        </div>
      )}
    </nav>
  );
}
