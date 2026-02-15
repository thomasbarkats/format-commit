import { useState, useEffect } from 'react';
import MarkdownDocs from '../components/MarkdownDocs';
import docsContent from '../docs.md?raw';


const sections = [
  { id: 'installation', label: 'Installation' },
  { id: 'usage', label: 'Usage' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'ai-suggestions', label: 'AI Suggestions' },
  { id: 'cli-options', label: 'CLI Options' },
];


export default function Docs() {
  const [active, setActive] = useState('installation');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) {
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinkClass = (id) =>
    `block text-sm py-1.5 pl-4 border-l-2 transition-colors cursor-pointer ${active === id
      ? 'border-[var(--color-accent)] text-white font-medium'
      : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-[var(--color-border-light)]'
    }`;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 flex gap-12">
      {/* Sidebar */}
      <aside className="hidden lg:block w-48 shrink-0">
        <nav className="sticky top-24 space-y-1">
          <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold mb-3 pl-4">
            Documentation
          </p>
          {sections.map((s) => (
            <button key={s.id} onClick={() => scrollTo(s.id)} className={navLinkClass(s.id)}>
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-bg)]/90 backdrop-blur-xl border-t border-[var(--color-border)] px-4 py-3">
        <div className="flex gap-1 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer
                ${active === s.id ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent-light)]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-3xl pb-20 lg:pb-0">
        <MarkdownDocs content={docsContent} />
      </div>
    </div>
  );
}
