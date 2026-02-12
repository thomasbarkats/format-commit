# format-commit

[![Node.js Version](https://img.shields.io/node/v/format-commit.svg)](https://nodejs.org/)
[![npm downloads](https://img.shields.io/npm/dm/format-commit.svg)](https://www.npmjs.com/package/format-commit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Lightweight CLI for consistent Git workflow & and optional AI support.

Standardize your commit messages and branch naming with configurable rules, and guide your development workflow through automated scripts. No bloat, no complexity - just clean, consistent Git practices. Feel free to let AI suggest commit titles for you in the expected format.

## Installation

```sh
npm i format-commit --save-dev
```

## Usage

Add to your `package.json` scripts:
```json
"scripts": {
  "commit": "format-commit",
  "branch": "format-commit --branch"
}
```

And use:
```sh
npm run commit # to commit
npm run branch # to create a branch
```

### Global Installation

Or install globally:
```sh
npm i -g format-commit
format-commit
format-commit --branch
```

### Initial Setup

On first use, format-commit will prompt you to configure your commit and branch.

If you want to reconfigure later from scratch, run:
```sh
format-commit --config
```

## Configuration

All configuration is stored in the `commit-config.json` file. Here is the list of all options.

`format`

Commit title format:
- 1: `(type) Name` / 2: `(type) name`
- 3: `type: Name` / 4: `type: name`
- 5: `type(scope) Name` / 6: `type(scope) name`
- 7: `type(scope): Name` / 8: `type(scope): name`

`branchFormat`

Branch naming format:
- 1: `type/description`
- 2: `type/scope/description`

`types`

Allowed commit and branch types (default: `feat`, `fix`, `core`, `test`, `config`, `doc`)

`scopes`

Scopes for commit and branch categorization (used in formats 5-8 for commits, format 2 for branches)

`minLength`

Minimum length required for the commit title.

`maxLength`

Maximum length required for the commit title and branch description.

`changeVersion`

Version change policy:
- `never (ignore)`: Never change version, skip prompt (default)
- `never (always ask)`: Always prompt for version change
- `only on release branch`: Only release branch commits require version change
- `always`: All commits require version change

`releaseBranch`

Main/release branch name (used if changeVersion = `only on release branch`)

`showAllVersionTypes`

Show all version types or only main ones (`major`/`minor`/`patch`/`custom`)

`ai.enabled`

Enable AI commit title suggestions (default: `false`)

`ai.provider`

AI provider:
- `anthropic` (Claude)
- `openai` (GPT)
- `google` (Gemini)

`ai.model`

Model identifier (e.g., `claude-haiku-4-5` or `gpt-4o-mini`)

`ai.envPath`

Path to .env file containing the AI provider API key (e.g., `.env`)

`ai.envKeyName`

Name of the environment variable for the API key (e.g., `OPENAI_API_KEY`)

`ai.largeDiffTokenThreshold`

Number of tokens from which not to use AI automatically.

### AI Suggestions

When AI is enabled, your staged changes will be processed by the defined AI to suggest commit titles that:
- Follow your configured format and naming conventions
- Automatically select appropriate types and scopes
- Respect your min/max length constraints
- Describe the actual changes in your code

You can either:
- Choose one of the 4 AI suggestions for quick commits (and can edit it)
- Select "Custom" to enter commit details manually (classic flow)

**Security:** AI provider API key is stored in a `.env` file automatically added to `.gitignore`.

## CLI Options

| Short | Long | Description |
| :---- | :--- | :---------- |
| `-c` | `--config` | Generate or update configuration file |
| `-b` | `--branch` | Create a new standardized branch |
| `-t` | `--test` | Test mode - preview without executing Git commands |

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
