# Documentation

(mb-10)Everything you need to set up and use format-commit.

## Installation

Install as a dev dependency in your project:

```sh
npm i format-commit --save-dev
```

Or install globally to use anywhere:

```sh
npm i -g format-commit
```

## Usage

### Package scripts (recommended)

Add these scripts to your `package.json`:

```json
"scripts": {
  "commit": "format-commit",
  "branch": "format-commit --branch"
}
```

Then use:

```sh
npm run commit   # create standardized commit
npm run branch   # create standardized branch
```

### Global usage

If installed globally, use the CLI directly:

```sh
format-commit           # commit
format-commit --branch  # create branch
```

### Initial setup

On first run, format-commit guides you through interactive configuration. To reconfigure later:

```sh
format-commit --config
```

## Configuration

(mb-6)All settings are stored in `commit-config.json` at your project root.

:::group

:::config(name="format" description="Commit title format. Choose a built-in format or use a custom pattern.")
1: (type) Description
2: (type) description
3: type: Description
4: type: description
5: type(scope) Description
6: type(scope) description
7: type(scope): Description
8: type(scope): description
"custom": Custom pattern
:::

:::section
<cfgh>customFormat</cfgh>

Define your own commit format pattern when `format` is set to `"custom"`.

:::card
#### Keywords (case-sensitive)

;;
`type` (text-slate-400 ml-2)Commit type (required). Casing is preserved from pattern.
`description` (text-slate-400 ml-2)Commit message (required). Casing is preserved from pattern.
`scope` (text-slate-400 ml-2)Scope category (optional). Casing is preserved from pattern.
:::

:::card
#### Custom fields

Add any custom fields using `{Field Name}` syntax. You'll be prompted for these values when committing.

```text
{Issue ID} - type - Description
{Ticket} [type] scope: Description
type(scope): Description - {JIRA-ID}
```
:::

:::card
#### Casing rules

(mb-2)Keywords automatically apply casing based on how they appear in your pattern:

;;(text-slate-300)
`type` → lowercase
`Type` → Capitalized
`TYPE` → UPPERCASE
:::

:::examples

```text
{Issue ID} - type - scope - Description
```
<result>Result: `PROJ-123 - feat - api - Add user endpoints`</result>

```text
[type] Description ({Ticket})
```
<result>Result: `[fix] Resolve login issue (TK-456)`</result>

:::
:::

:::config(name="branchFormat" description="Branch naming format.")
1: type/description
2: type/scope/description
"custom": Custom pattern
:::

:::section
<cfgh>customBranchFormat</cfgh>

Define your own branch naming pattern when `branchFormat` is set to `"custom"`.

:::card
#### Same syntax as customFormat

Uses the same keywords (`type`, `scope`, `description`) and custom fields (`{Field}`).
:::

:::warning
#### Branch naming rules

;;
**Literal separators** must be valid Git branch characters (no `spaces ~ ^ : ? * [ \ .. //`).
**Dynamic parts** (description and custom fields) are automatically sanitized: spaces become `-`, invalid characters are removed.
:::

:::examples

```text
type/{Issue ID}-description
```
<result>Result: `feat/PROJ-123-user-authentication`</result>

```text
{Sprint}/type-scope-description
```
<result>Result: `sprint-42/fix-api-error-login`</result>

:::
:::

:::section
<cfgh>types</cfgh>

Array of allowed commit/branch types. Each type has a `value` and optional `description`.

:::card
#### Default types

```json
"types": [
  { "value": "feat", "description": "New feature(s)" },
  { "value": "fix", "description": "Issue(s) fixing" },
  { "value": "core", "description": "Change(s) on application core" },
  { "value": "test", "description": "Change(s) related to tests" },
  { "value": "config", "description": "Project configuration" },
  { "value": "doc", "description": "Documentation / comment(s)" }
]
```
:::

Customize these in `commit-config.json` to match your workflow (e.g., add `chore`, `refactor`, `style`).
:::

:::section
<cfgh>scopes</cfgh>

Array of scope categories. Required when using formats 5-8, branch format 2, or when a custom format includes the `scope` keyword.

:::card
#### Example scopes

```json
"scopes": [
  { "value": "api", "description": "Backend API" },
  { "value": "ui", "description": "User interface" },
  { "value": "db", "description": "Database" },
  { "value": "auth", "description": "Authentication" }
]
```
:::

;;
If using default scope `"example"`, you'll see a warning and AI suggestions will be disabled.
Set to `undefined` or empty array if your format doesn't use scopes.
:::

:::section
<cfgh>minLength / maxLength</cfgh>

Length constraints for commit titles and branch descriptions.

;;(text-slate-300)
`minLength`: Minimum commit title length (default: `8`)
`maxLength`: Maximum commit title and branch description length (default: `80`)

Validation occurs on the **formatted title** including type, scope, and separators. AI suggestions respect these limits.
:::

:::section
<cfgh>changeVersion</cfgh>

Controls when format-commit prompts you to update `package.json` version using `npm version`.

:::options
"ignore" Never prompt for version change (default)

"never" Always ask if you want to change version (on every commit)

"releaseBranch" Require version change only when committing on release branch (specified in `releaseBranch`)

"always" Require version change on every commit
:::
:::

:::config(name="releaseBranch")
Main/release branch name (e.g., `"main"` or `"master"`).
Used when `changeVersion` is set to `"releaseBranch"`.
:::

:::section
<cfgh>showAllVersionTypes</cfgh>

Show all npm version types or only main ones when prompting for version change.

:::card
#### Main types (`false`)

;;(text-xs text-slate-400)
`patch` - Bug fixes (1.0.0 → 1.0.1)
`minor` - New features (1.0.0 → 1.1.0)
`major` - Breaking changes (1.0.0 → 2.0.0)
`custom` - Enter version manually
:::

:::card
#### All types (`true`)

;;(text-xs text-slate-400)
Main types +
`prepatch`, `preminor`, `premajor`
`prerelease` - Pre-release versions
`from-git` - Get version from Git tag
:::
:::

:::

## AI Suggestions

(mb-6)When enabled, format-commit analyzes your staged changes and generates 4 commit title suggestions that follow your configured format, types, scopes, and length constraints.

:::card(rounded-xl p-5 mb-8)
#### How it works

:::steps
Run `format-commit` with staged changes
Git diff is sent to AI model with your config (format, types, scopes, length limits)
AI returns 4 title suggestions matching your exact format
Pick a suggestion (editable) or choose "Custom" for manual entry
Continue with description, version change, and push options
:::
:::

:::group(mt-8)

:::config(name="ai.enabled")
Enable AI commit title suggestions. Default: `false`
:::

:::section
<cfgh>ai.provider</cfgh>

AI provider to use for suggestions.

:::options
"anthropic" Anthropic (Claude)
Models: `claude-haiku-4-5` (fast & cheap), `claude-sonnet-4-5` (balanced)

"openai" OpenAI (GPT)
Models: `gpt-4o-mini` (fast & cheap), `gpt-4o` (more capable)

"google" Google (Gemini)
Models: `gemini-2.0-flash` (fast & free), `gemini-1.5-pro` (more capable)
:::
:::

:::config(name="ai.model")
Model identifier for the selected provider. Choose based on speed/cost trade-off.
:::

:::section
<cfgh>ai.envPath</cfgh>

Path to `.env` file containing your API key (default: `".env"`).

:::card
#### Security

;;
File is automatically added to `.gitignore` during setup
API key is stored locally and never committed to Git
Setup validates that `.env` is in `.gitignore` before proceeding
:::
:::

:::config(name="ai.envKeyName")
Environment variable name for the API key (e.g., `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`).
Defaults to `<PROVIDER>_API_KEY`.
:::

:::section
<cfgh>ai.largeDiffTokenThreshold</cfgh>

Token count threshold to prevent AI calls on very large diffs (default: `20000`).

;;
When your staged diff exceeds this token count, AI suggestions are skipped and you're prompted for manual entry.
Prevents excessive API costs and slow responses on massive changesets.
:::

:::

## CLI Options

:::table
| Short | Long | Description |
| `-c` | `--config` | Generate or update configuration file |
| `-b` | `--branch` | Create a new standardized branch |
| `-t` | `--test` | Preview without executing Git commands |
| `-d` | `--debug` | Display additional logs |
:::
