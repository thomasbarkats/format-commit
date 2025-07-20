# format-commit

[![npm version](https://badge.fury.io/js/format-commit.svg)](https://badge.fury.io/js/format-commit)
[![Node.js Version](https://img.shields.io/node/v/format-commit.svg)](https://nodejs.org/)
[![npm downloads](https://img.shields.io/npm/dm/format-commit.svg)](https://www.npmjs.com/package/format-commit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🚀 Lightweight CLI for consistent Git workflow formatting.

Standardize your commit messages and branch naming with configurable rules, and guide your development workflow through automated scripts. No bloat, no complexity — just clean, consistent Git practices.

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

Then use:
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

On first use, format-commit will prompt you to configure your commit and branch formats, then create a `commit-config.json` file.

To reconfigure later, run:
```sh
format-commit --config
```

## Configuration

| Property | Description |
| :------- | :---------- |
| **format** | Commit title format:<br>1 - `(type) Name` / 2 - `(type) name`<br>3 - `type: Name` / 4 - `type: name`<br>5 - `type(scope) Name` / 6 - `type(scope) name`<br>7 - `type(scope): Name` / 8 - `type(scope): name` |
| **branchFormat** | Branch naming format:<br>1 - `type/description`<br>2 - `type/scope/description` |
| **types** | Allowed commit and branch types (default: `feat`, `fix`, `core`, `test`, `config`, `doc`) |
| **scopes** | Scopes for commit/branch categorization (used in formats 5-8 for commits, format 2 for branches) |
| **minLength** | Minimum length required for the commit title |
| **maxLength** | Maximum length required for the commit title and branch description |
| **changeVersion** | Version change policy:<br>`never` - Always prompt for version change<br>`only on release branch` - Only release branch commits require version change<br>`always` - All commits require version change |
| **releaseBranch** | Main/release branch name (used if changeVersion = `only on release branch`) |
| **showAllVersionTypes** | Show all version types or only main ones (`major`/`minor`/`patch`/`custom`) |
| **stageAllChanges** | Auto-stage all changes before commit ⚠️ |

## CLI Options

| Option | Description |
| :----- | :---------- |
| `--config` / `-c` | Generate or update configuration file |
| `--branch` / `-b` | Create a new standardized branch |
| `--test` / `-t` | Test mode - preview without executing Git commands |

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
