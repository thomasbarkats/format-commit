'use strict';

const { execSync } = require('child_process');
const { gray, bold, red, green, yellow } = require('kleur');


const askForVersion = (config, branch) => {
  if (
    config.changeVersion === 'always'
    || (config.changeVersion === 'releaseBranch' && branch === config.releaseBranch)
  ) {
    return true;
  }
  return false;
};

const getCurrentBranch = () => {
  return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
};

const hasStagedChanges = () => {
  try {
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    return staged.trim().length > 0;
  } catch {
    return false;
  }
};

const validCommitTitle = (title, lenMin, lenMax) => {
  if (title.length < lenMin) {
    return 'Commit title too short';
  } else if (title.length > lenMax) {
    return 'Commit title too long';
  }
  return true;
};

const validCommitTitleSetupLength = (len) => {
  if (len < 1) {
    return `${len} isn't a valid length`;
  } else if (len > 255) {
    return 'length cannot be higher than 255';
  }
  return true;
};

const validVersion = (version) => {
  const regex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  if (!regex.test(version)) {
    return 'Version does not respect semantic versioning';
  }
  return true;
};

const formatCommitTitle = (type, title, format, scope = '*') => {
  switch (format) {
    case 1:
    default:
      return `(${type}) ${title[0].toUpperCase()}${title.substr(1).toLowerCase()}`;
    case 2:
      return `(${type}) ${title.toLowerCase()}`;
    case 3:
      return `${type}: ${title[0].toUpperCase()}${title.substr(1).toLowerCase()}`;
    case 4:
      return `${type}: ${title.toLowerCase()}`;
    case 5:
      return `${type}(${scope}) ${title[0].toUpperCase()}${title.substr(1).toLowerCase()}`;
    case 6:
      return `${type}(${scope}) ${title.toLowerCase()}`;
    case 7:
      return `${type}(${scope}): ${title[0].toUpperCase()}${title.substr(1).toLowerCase()}`;
    case 8:
      return `${type}(${scope}): ${title.toLowerCase()}`;
  }
};

const handleCmdExec = (command) => {
  try {
    const output = execSync(command);
    return output.toString();
  } catch (err) {
    log(`Error\n${err.message ? err.message : err}`, 'error');
  }
};

const log = (message, type) => {
  const date = gray(`[${new Date().toISOString()}]`);
  let msg = `${bold('format-commit')}: ${message}`;
  switch (type) {
    case 'error':
      msg = red(msg);
      break;
    case 'success':
      msg = green(msg);
      break;
    case 'warning':
      msg = yellow(msg);
      break;
  }
  console.log(`${date} ${type === 'error' ? red(msg) : (type === 'success' ? green(msg) : msg)}`);
};

const validBranchDescription = (description, maxLength) => {
  if (description.length < 1) {
    return 'Branch description cannot be empty';
  }
  if (description.length > maxLength) {
    return `Branch description too long (max ${maxLength} characters)`;
  }
  const invalidChars = /[~^:?*[\\\s]/;
  if (invalidChars.test(description)) {
    return 'Branch description contains invalid characters (spaces, ~, ^, :, ?, *, [, \\)';
  }
  if (description.startsWith('.') || description.startsWith('-') ||
    description.endsWith('.') || description.endsWith('-')) {
    return 'Branch description cannot start or end with . or -';
  }
  return true;
};

const formatBranchName = (type, description, format, scope = null) => {
  const cleanDescription = description
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  switch (format) {
    case 1:
    default:
      return `${type}/${cleanDescription}`;
    case 2:
      return scope ? `${type}/${scope}/${cleanDescription}` : `${type}/${cleanDescription}`;
  }
};

const checkBranchExists = (branchName) => {
  try {
    const localBranches = execSync('git branch --list').toString();
    if (localBranches.includes(branchName)) {
      return true;
    }
    const remoteBranches = execSync('git branch -r --list').toString();
    if (remoteBranches.includes(`origin/${branchName}`)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};


module.exports = {
  askForVersion,
  getCurrentBranch,
  hasStagedChanges,
  validCommitTitle,
  validCommitTitleSetupLength,
  validBranchDescription,
  validVersion,
  formatCommitTitle,
  formatBranchName,
  checkBranchExists,
  handleCmdExec,
  log,
};
