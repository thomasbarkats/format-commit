# format-commit

[![npm version](https://badge.fury.io/js/format-commit.svg)](https://badge.fury.io/js/format-commit)
[![Node.js Version](https://img.shields.io/node/v/format-commit.svg)](https://nodejs.org/)
[![npm downloads](https://img.shields.io/npm/dm/format-commit.svg)](https://www.npmjs.com/package/format-commit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🚀 Lightweight CLI for consistent commit message formatting.

Standardize your commit naming with basic rules, and guide your workflow through an automated script. No bloat, no complexity — just clean, consistent commits.

## Installation

```sh
npm i format-commit --save-dev
```

## Usage

Add to your `package.json` scripts:
```json
"scripts": {
  "commit": "format-commit"
}
```

Then use:
```sh
npm run commit
```

Or install globally:
```sh
npm i -g format-commit
format-commit
```

On first use, format-commit will prompt you to configure your commit format and create a `commit-config.json` file.

To reconfigure later, run:
```sh
format-commit --config
```

## Configuration

| Property | Description |
| :------- | :---------- |
| **format** | Commit title format:<br>1 - `(type) Name` / 2 - `(type) name`<br>3 - `type: Name` / 4 - `type: name`<br>5 - `type(scope) Name` / 6 - `type(scope) name`<br>7 - `type(scope): Name` / 8 - `type(scope): name` |
| **types** | Allowed commit types (default: `feat`, `fix`, `core`, `test`, `config`, `doc`) |
| **scopes** | Scopes for commit categorization (formats 5-8 only) |
| **minLength** | Minimum length required for the commit title |
| **maxLength** | Maximum length required for the commit title |
| **changeVersion** | Version change policy:<br>`never` - Always prompt for version change<br>`only on release branch` - Only release branch commits require version change<br>`always` - All commits require version change |
| **releaseBranch** | Main/release branch name (used if changeVersion = `only on release branch`) |
| **showAllVersionTypes** | Show all version types or only main ones (`major`/`minor`/`patch`/`custom`) |
| **stageAllChanges** | Auto-stage all changes before commit ⚠️ |

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
