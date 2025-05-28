# format-commit

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
| **scopes** | Application scopes for commit categorization (formats 5-8 only) |
| **minLength** | Minimum commit title length |
| **maxLength** | Maximum commit title length |
| **changeVersion** | Version change policy:<br>`always` - All commits require version change<br>`only on release branch` - Only release branch commits require version change<br>`never` - Always prompt for version change |
| **releaseBranch** | Main/release branch name (used with `only on release branch`) |
| **showAllVersionTypes** | Show all version types or only main ones (`major`/`minor`/`patch`/`custom`) |
| **stageAllChanges** | Auto-stage all changes before commit |