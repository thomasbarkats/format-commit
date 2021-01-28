# format-commit

Easily format and standardize your commits for all your javascript projects using Git.

## Installation

```sh
$ npm i format-commit --save-dev
```

## Usage

In the scripts part of your package.json file add a new line `"commit": "format-commit"` and use `$ npm run commit` to commit your changes with format-commit.

Or install format-commit globally to use directly `$ format-commit` command .

The first time you use the command within your project, format-commit will ask you some questions to configure your commits and create a configuration file `commit-config.json` at the root of your project.

If you want to change format-commit configuration without manually editing the json file you can run the command `$ format-commit --config`.

## Configuration

| Property | Description |
| :------- | :---------- |
| **format** | The formatting of your commit titles. <br> 1: (type) Name / 2: (type) name <br> 3: type: Name / 4: type: Name |
| **types** | The different types of commit allowed. Not defined during assisted configuration, default values used: <br> feat / fix / core / test |
| **minLength** | Minimum size allowed for your commit titles |
| **maxLength** | Maximum size allowed for your commit titles |
| **changeVersion** | "always": All commits must obligatorily involve a change of version (no preliminary request). <br> "only on release branch": All commits on your release/main branch must obligatorily involve a change of version (no preliminary request). <br> "never": Commits do not necessarily lead to a version change whatever the branch, the wizard will always ask. |
| **releaseBranch** | Release/main Git branch of your project. Use if changeVersion is defined on "only on release branch". |
| **showAllVersionTypes** | Show all possible types of version changes in the wizard, or show only the main ones (major / minor / patch / \<custom\>) |
| **stageAllChanges** | Auto-stage all changes before each commit |
