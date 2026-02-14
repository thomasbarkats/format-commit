import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-center gap-2 text-sm text-slate-500">
        <span>Built with</span>
        <Heart size={14} className="text-[var(--color-accent)]" />
        <span>
          by{" "}
          <a
            href="https://github.com/thomasbarkats"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
          >
            Thomas Barkats
          </a>
        </span>
      </div>
    </footer>
  );
}
