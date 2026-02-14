import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";

function Code({ children, lang }) {
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

function InlineCode({ children }) {
  return (
    <code className="font-mono text-sm bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-accent-light)] px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}

const sections = [
  { id: "installation", label: "Installation" },
  { id: "usage", label: "Usage" },
  { id: "configuration", label: "Configuration" },
  { id: "ai", label: "AI Suggestions" },
  { id: "cli", label: "CLI Options" },
];

export default function Docs() {
  const [active, setActive] = useState("installation");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const navLinkClass = (id) =>
    `block text-sm py-1.5 pl-4 border-l-2 transition-colors cursor-pointer ${active === id
      ? "border-[var(--color-accent)] text-white font-medium"
      : "border-transparent text-slate-500 hover:text-slate-300 hover:border-[var(--color-border-light)]"
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
              className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${active === s.id
                ? "bg-[var(--color-accent)]/15 text-[var(--color-accent-light)]"
                : "text-slate-500 hover:text-slate-300"
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-3xl pb-20 lg:pb-0">
        {/* Installation */}
        <section id="installation" className="scroll-mt-24 mb-20">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Documentation
          </h1>
          <p className="text-slate-400 mb-10">
            Everything you need to set up and use format-commit.
          </p>

          <h2 className="text-xl font-semibold mb-4 text-white">
            Installation
          </h2>

          <p className="text-slate-400 mb-3">
            Install as a dev dependency in your project:
          </p>
          <Code lang="sh">npm i format-commit --save-dev</Code>

          <p className="text-slate-400 mt-6 mb-3">
            Or install globally to use anywhere:
          </p>
          <Code lang="sh">npm i -g format-commit</Code>
        </section>

        {/* Usage */}
        <section id="usage" className="scroll-mt-24 mb-20">
          <h2 className="text-xl font-semibold mb-4 text-white">Usage</h2>

          <h3 className="text-lg font-semibold mb-3 text-white">
            Package scripts (recommended)
          </h3>
          <p className="text-slate-400 mb-3">
            Add these scripts to your <InlineCode>package.json</InlineCode>:
          </p>
          <Code lang="json">{`"scripts": {
  "commit": "format-commit",
  "branch": "format-commit --branch"
}`}</Code>

          <p className="text-slate-400 mt-6 mb-3">Then use:</p>
          <Code lang="sh">{`npm run commit   # create standardized commit
npm run branch   # create standardized branch`}</Code>

          <h3 className="text-lg font-semibold mt-8 mb-3 text-white">
            Global usage
          </h3>
          <p className="text-slate-400 mb-3">
            If installed globally, use the CLI directly:
          </p>
          <Code lang="sh">{`format-commit           # commit
format-commit --branch  # create branch`}</Code>

          <h3 className="text-lg font-semibold mt-8 mb-3 text-white">
            Initial setup
          </h3>
          <p className="text-slate-400 mb-3">
            On first run, format-commit guides you through interactive configuration. To reconfigure later:
          </p>
          <Code lang="sh">format-commit --config</Code>
        </section>

        {/* Configuration */}
        <section id="configuration" className="scroll-mt-24 mb-20">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Configuration
          </h2>
          <p className="text-slate-400 mb-6">
            All settings are stored in{" "}
            <InlineCode>commit-config.json</InlineCode> at your project root.
          </p>

          <div className="space-y-8">
            <ConfigOption
              name="format"
              description="Commit title format. Choose a built-in format or use a custom pattern."
              options={[
                { value: "1", label: "(type) Description" },
                { value: "2", label: "(type) description" },
                { value: "3", label: "type: Description" },
                { value: "4", label: "type: description" },
                { value: "5", label: "type(scope) Description" },
                { value: "6", label: "type(scope) description" },
                { value: "7", label: "type(scope): Description" },
                { value: "8", label: "type(scope): description" },
                { value: '"custom"', label: "Custom pattern" },
              ]}
            />

            <div className="border-b border-[var(--color-border)]/50 pb-6">
              <h3 className="font-mono text-sm font-medium text-[var(--color-accent-light)] mb-2">
                customFormat
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Define your own commit format pattern when <InlineCode>format</InlineCode> is set to <InlineCode>"custom"</InlineCode>.
              </p>

              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Keywords (case-sensitive)
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <InlineCode>type</InlineCode>
                    <span className="text-slate-400 ml-2">
                      Commit type (required). Casing is preserved from pattern.
                    </span>
                  </div>
                  <div>
                    <InlineCode>description</InlineCode>
                    <span className="text-slate-400 ml-2">
                      Commit message (required). Casing is preserved from pattern.
                    </span>
                  </div>
                  <div>
                    <InlineCode>scope</InlineCode>
                    <span className="text-slate-400 ml-2">
                      Scope category (optional). Casing is preserved from pattern.
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Custom fields
                </h4>
                <p className="text-sm text-slate-400 mb-2">
                  Add any custom fields using <InlineCode>{"{Field Name}"}</InlineCode> syntax.
                  You'll be prompted for these values when committing.
                </p>
                <Code lang="text">{`{Issue ID} - type - Description
{Ticket} [type] scope: Description
type(scope): Description - {JIRA-ID}`}</Code>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Casing rules
                </h4>
                <p className="text-sm text-slate-400 mb-2">
                  Keywords automatically apply casing based on how they appear in your pattern:
                </p>
                <div className="space-y-1 text-sm text-slate-300">
                  <div><InlineCode>type</InlineCode> → lowercase</div>
                  <div><InlineCode>Type</InlineCode> → Capitalized</div>
                  <div><InlineCode>TYPE</InlineCode> → UPPERCASE</div>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-xs text-slate-600">Examples:</span>
                <div className="mt-2 space-y-2">
                  <Code lang="text">{`{Issue ID} - type - scope - Description`}</Code>
                  <div className="text-xs text-slate-500 -mt-2 pl-4">
                    Result: <InlineCode>PROJ-123 - feat - api - Add user endpoint</InlineCode>
                  </div>
                  <Code lang="text">{`[type] Description ({Ticket})`}</Code>
                  <div className="text-xs text-slate-500 -mt-2 pl-4">
                    Result: <InlineCode>[fix] Resolve login issue (TK-456)</InlineCode>
                  </div>
                </div>
              </div>
            </div>

            <ConfigOption
              name="branchFormat"
              description="Branch naming format."
              options={[
                { value: "1", label: "type/description" },
                { value: "2", label: "type/scope/description" },
                { value: '"custom"', label: "Custom pattern" },
              ]}
            />

            <div className="border-b border-[var(--color-border)]/50 pb-6">
              <h3 className="font-mono text-sm font-medium text-[var(--color-accent-light)] mb-2">
                customBranchFormat
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Define your own branch naming pattern when <InlineCode>branchFormat</InlineCode> is set to <InlineCode>"custom"</InlineCode>.
              </p>

              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Same syntax as customFormat
                </h4>
                <p className="text-sm text-slate-400 mb-2">
                  Uses the same keywords (<InlineCode>type</InlineCode>, <InlineCode>scope</InlineCode>, <InlineCode>description</InlineCode>) and custom fields (<InlineCode>{"{Field}"}</InlineCode>).
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-amber-200 mb-3">
                  Branch naming rules
                </h4>
                <div className="space-y-2 text-sm text-slate-300">
                  <div>
                    <span className="text-white">Literal separators</span> must be valid Git branch characters (no <InlineCode>spaces ~ ^ : ? * [ \ .. //</InlineCode>).
                  </div>
                  <div>
                    <span className="text-white">Dynamic parts</span> (description and custom fields) are automatically sanitized: spaces become <InlineCode>-</InlineCode>, invalid characters are removed.
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-xs text-slate-600">Examples:</span>
                <div className="mt-2 space-y-2">
                  <Code lang="text">{`type/{Issue ID}-description`}</Code>
                  <div className="text-xs text-slate-500 -mt-2 pl-4">
                    Result: <InlineCode>feat/PROJ-123-user-authentication</InlineCode>
                  </div>
                  <Code lang="text">{`{Sprint}/type-scope-description`}</Code>
                  <div className="text-xs text-slate-500 -mt-2 pl-4">
                    Result: <InlineCode>sprint-42/fix-api-login-error</InlineCode>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-[var(--color-border)]/50 pb-6">
              <h3 className="font-mono text-sm font-medium text-[var(--color-accent-light)] mb-2">
                types
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Array of allowed commit/branch types. Each type has a <InlineCode>value</InlineCode> and optional <InlineCode>description</InlineCode>.
              </p>

              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 mb-3">
                <h4 className="text-sm font-semibold text-white mb-2">
                  Default types
                </h4>
                <Code lang="json">{`"types": [
  { "value": "feat", "description": "New feature(s)" },
  { "value": "fix", "description": "Issue(s) fixing" },
  { "value": "core", "description": "Change(s) on application core" },
  { "value": "test", "description": "Change(s) related to tests" },
  { "value": "config", "description": "Project configuration" },
  { "value": "doc", "description": "Documentation / comment(s)" }
]`}</Code>
              </div>

              <p className="text-sm text-slate-400">
                Customize these in <InlineCode>commit-config.json</InlineCode> to match your workflow (e.g., add <InlineCode>chore</InlineCode>, <InlineCode>refactor</InlineCode>, <InlineCode>style</InlineCode>).
              </p>
            </div>

            <div className="border-b border-[var(--color-border)]/50 pb-6">
              <h3 className="font-mono text-sm font-medium text-[var(--color-accent-light)] mb-2">
                scopes
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Array of scope categories. Required when using formats 5-8, branch format 2, or when a custom format includes the <InlineCode>scope</InlineCode> keyword.
              </p>

              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 mb-3">
                <h4 className="text-sm font-semibold text-white mb-2">
                  Example scopes
                </h4>
                <Code lang="json">{`"scopes": [
  { "value": "api", "description": "Backend API" },
  { "value": "ui", "description": "User interface" },
  { "value": "db", "description": "Database" },
  { "value": "auth", "description": "Authentication" }
]`}</Code>
              </div>

              <div className="text-sm text-slate-400 space-y-2">
                <div>
                  If using default scope <InlineCode>"example"</InlineCode>, you'll see a warning and AI suggestions will be disabled.
                </div>
                <div>
                  Set to <InlineCode>undefined</InlineCode> or empty array if your format doesn't use scopes.
                </div>
              </div>
            </div>

            <div className="border-b border-[var(--color-border)]/50 pb-6">
              <h3 className="font-mono text-sm font-medium text-[var(--color-accent-light)] mb-2">
                minLength / maxLength
              </h3>
              <p className="text-sm text-slate-400 mb-3">
                Length constraints for commit titles and branch descriptions.
              </p>

              <div className="space-y-2 text-sm text-slate-300">
                <div>
                  <InlineCode>minLength</InlineCode>: Minimum commit title length (default: <InlineCode>8</InlineCode>)
                </div>
                <div>
                  <InlineCode>maxLength</InlineCode>: Maximum commit title and branch description length (default: <InlineCode>80</InlineCode>)
                </div>
              </div>

              <p className="text-sm text-slate-400 mt-3">
                Validation occurs on the <strong>formatted title</strong> including type, scope, and separators. AI suggestions respect these limits.
              </p>
            </div>

            <div className="border-b border-[var(--color-border)]/50 pb-6">
              <h3 className="font-mono text-sm font-medium text-[var(--color-accent-light)] mb-2">
                changeVersion
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Controls when format-commit prompts you to update <InlineCode>package.json</InlineCode> version using <InlineCode>npm version</InlineCode>.
              </p>

              <div className="space-y-3 text-sm">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
                  <div className="font-mono text-xs text-slate-500 mb-1">
                    "ignore"
                  </div>
                  <div className="text-slate-300">
                    Never prompt for version change (default)
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
                  <div className="font-mono text-xs text-slate-500 mb-1">
                    "never"
                  </div>
                  <div className="text-slate-300">
                    Always ask if you want to change version (on every commit)
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
                  <div className="font-mono text-xs text-slate-500 mb-1">
                    "releaseBranch"
                  </div>
                  <div className="text-slate-300">
                    Require version change only when committing on release branch (specified in <InlineCode>releaseBranch</InlineCode>)
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
                  <div className="font-mono text-xs text-slate-500 mb-1">
                    "always"
                  </div>
                  <div className="text-slate-300">
                    Require version change on every commit
                  </div>
                </div>
              </div>
            </div>

            <ConfigOption
              name="releaseBranch"
              description={
                <div className="text-sm text-slate-400 space-y-2">
                  <div>
                    Main/release branch name (e.g., <InlineCode>"main"</InlineCode> or <InlineCode>"master"</InlineCode>).
                  </div>
                  <div>
                    Used when{" "}
                    <InlineCode>changeVersion</InlineCode> is set to{" "}
                    <InlineCode>"releaseBranch"</InlineCode>.
                  </div>
                </div>
              }
            />

            <div className="border-b border-[var(--color-border)]/50 pb-6">
              <h3 className="font-mono text-sm font-medium text-[var(--color-accent-light)] mb-2">
                showAllVersionTypes
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Show all npm version types or only main ones when prompting for version change.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
                  <div className="text-sm font-semibold text-white mb-2">
                    Main types (<InlineCode>false</InlineCode>)
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    <div><InlineCode>patch</InlineCode> - Bug fixes (1.0.0 → 1.0.1)</div>
                    <div><InlineCode>minor</InlineCode> - New features (1.0.0 → 1.1.0)</div>
                    <div><InlineCode>major</InlineCode> - Breaking changes (1.0.0 → 2.0.0)</div>
                    <div><InlineCode>custom</InlineCode> - Enter version manually</div>
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
                  <div className="text-sm font-semibold text-white mb-2">
                    All types (<InlineCode>true</InlineCode>)
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    <div>Main types +</div>
                    <div><InlineCode>prepatch</InlineCode>, <InlineCode>preminor</InlineCode>, <InlineCode>premajor</InlineCode></div>
                    <div><InlineCode>prerelease</InlineCode> - Pre-release versions</div>
                    <div><InlineCode>from-git</InlineCode> - Get version from Git tag</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI */}
        <section id="ai" className="scroll-mt-24 mb-20">
          <h2 className="text-xl font-semibold mb-4 text-white">
            AI Suggestions
          </h2>
          <p className="text-slate-400 mb-6">
            When enabled, format-commit analyzes your staged changes and generates 4 commit title suggestions that follow your configured format, types, scopes, and length constraints.
          </p>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 mb-8">
            <h4 className="text-sm font-semibold text-white mb-3">
              How it works
            </h4>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex gap-3">
                <div className="text-[var(--color-accent)] font-mono shrink-0">1.</div>
                <div>Run <InlineCode>format-commit</InlineCode> with staged changes</div>
              </div>
              <div className="flex gap-3">
                <div className="text-[var(--color-accent)] font-mono shrink-0">2.</div>
                <div>Git diff is sent to AI model with your config (format, types, scopes, length limits)</div>
              </div>
              <div className="flex gap-3">
                <div className="text-[var(--color-accent)] font-mono shrink-0">3.</div>
                <div>AI returns 4 title suggestions matching your exact format</div>
              </div>
              <div className="flex gap-3">
                <div className="text-[var(--color-accent)] font-mono shrink-0">4.</div>
                <div>Pick a suggestion (editable) or choose "Custom" for manual entry</div>
              </div>
              <div className="flex gap-3">
                <div className="text-[var(--color-accent)] font-mono shrink-0">5.</div>
                <div>Continue with description, version change, and push options</div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <ConfigOption
              name="ai.enabled"
              description={
                <>
                  Enable AI commit title suggestions. Default: <InlineCode>false</InlineCode>
                </>
              }
            />

            <div className="border-b border-[var(--color-border)]/50 pb-6">
              <h3 className="font-mono text-sm font-medium text-[var(--color-accent-light)] mb-2">
                ai.provider
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                AI provider to use for suggestions.
              </p>

              <div className="space-y-3">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
                  <div className="font-mono text-xs text-slate-500 mb-1">
                    "anthropic"
                  </div>
                  <div className="text-sm text-slate-300 mb-2">Anthropic (Claude)</div>
                  <div className="text-xs text-slate-400">
                    Models: <InlineCode>claude-haiku-4-5</InlineCode> (fast & cheap), <InlineCode>claude-sonnet-4-5</InlineCode> (balanced)
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
                  <div className="font-mono text-xs text-slate-500 mb-1">
                    "openai"
                  </div>
                  <div className="text-sm text-slate-300 mb-2">OpenAI (GPT)</div>
                  <div className="text-xs text-slate-400">
                    Models: <InlineCode>gpt-4o-mini</InlineCode> (fast & cheap), <InlineCode>gpt-4o</InlineCode> (more capable)
                  </div>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
                  <div className="font-mono text-xs text-slate-500 mb-1">
                    "google"
                  </div>
                  <div className="text-sm text-slate-300 mb-2">Google (Gemini)</div>
                  <div className="text-xs text-slate-400">
                    Models: <InlineCode>gemini-2.0-flash</InlineCode> (fast & free), <InlineCode>gemini-1.5-pro</InlineCode> (more capable)
                  </div>
                </div>
              </div>
            </div>

            <ConfigOption
              name="ai.model"
              description={
                <>
                  Model identifier for the selected provider. Choose based on speed/cost trade-off.
                </>
              }
            />

            <div className="border-b border-[var(--color-border)]/50 pb-6">
              <h3 className="font-mono text-sm font-medium text-[var(--color-accent-light)] mb-2">
                ai.envPath
              </h3>
              <p className="text-sm text-slate-400 mb-3">
                Path to <InlineCode>.env</InlineCode> file containing your API key (default: <InlineCode>".env"</InlineCode>).
              </p>

              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-2">
                  Security
                </h4>
                <div className="text-sm text-slate-400 space-y-2">
                  <div>
                    File is automatically added to <InlineCode>.gitignore</InlineCode> during setup
                  </div>
                  <div>
                    API key is stored locally and never committed to Git
                  </div>
                  <div>
                    Setup validates that <InlineCode>.env</InlineCode> is in <InlineCode>.gitignore</InlineCode> before proceeding
                  </div>
                </div>
              </div>
            </div>

            <ConfigOption
              name="ai.envKeyName"
              description={
                <div className="text-sm text-slate-400 space-y-2">
                  <div>
                    Environment variable name for the API key (e.g., <InlineCode>ANTHROPIC_API_KEY</InlineCode>, <InlineCode>OPENAI_API_KEY</InlineCode>, <InlineCode>GOOGLE_API_KEY</InlineCode>).
                  </div>
                  <div>
                    Defaults to <InlineCode>&lt;PROVIDER&gt;_API_KEY</InlineCode>.
                  </div>
                </div>
              }
            />

            <div className="border-b border-[var(--color-border)]/50 pb-6">
              <h3 className="font-mono text-sm font-medium text-[var(--color-accent-light)] mb-2">
                ai.largeDiffTokenThreshold
              </h3>
              <p className="text-sm text-slate-400 mb-3">
                Token count threshold to prevent AI calls on very large diffs (default: <InlineCode>20000</InlineCode>).
              </p>

              <div className="text-sm text-slate-400 space-y-2">
                <div>
                  When your staged diff exceeds this token count, AI suggestions are skipped and you're prompted for manual entry
                </div>
                <div>
                  Prevents excessive API costs and slow responses on massive changesets
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CLI */}
        <section id="cli" className="scroll-mt-24 mb-10">
          <h2 className="text-xl font-semibold mb-4 text-white">
            CLI Options
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-3 pr-4 text-slate-500 font-medium">
                    Short
                  </th>
                  <th className="text-left py-3 pr-4 text-slate-500 font-medium">
                    Long
                  </th>
                  <th className="text-left py-3 text-slate-500 font-medium">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-b border-[var(--color-border)]/50">
                  <td className="py-3 pr-4">
                    <InlineCode>-c</InlineCode>
                  </td>
                  <td className="py-3 pr-4">
                    <InlineCode>--config</InlineCode>
                  </td>
                  <td className="py-3">
                    Generate or update configuration file
                  </td>
                </tr>
                <tr className="border-b border-[var(--color-border)]/50">
                  <td className="py-3 pr-4">
                    <InlineCode>-b</InlineCode>
                  </td>
                  <td className="py-3 pr-4">
                    <InlineCode>--branch</InlineCode>
                  </td>
                  <td className="py-3">Create a new standardized branch</td>
                </tr>
                <tr className="border-b border-[var(--color-border)]/50">
                  <td className="py-3 pr-4">
                    <InlineCode>-t</InlineCode>
                  </td>
                  <td className="py-3 pr-4">
                    <InlineCode>--test</InlineCode>
                  </td>
                  <td className="py-3">
                    Preview without executing Git commands
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">
                    <InlineCode>-d</InlineCode>
                  </td>
                  <td className="py-3 pr-4">
                    <InlineCode>--debug</InlineCode>
                  </td>
                  <td className="py-3">Display additional logs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function ConfigOption({ name, description, options, example }) {
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
