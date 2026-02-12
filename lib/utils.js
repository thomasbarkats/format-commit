import { execSync } from 'child_process';
import kleur from 'kleur';


const { gray, bold, red, green, yellow } = kleur;

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
    return `Commit title too short (current ${title.length} - minimum ${lenMin})`;
  } else if (title.length > lenMax) {
    return `Commit title too long (current ${title.length} - maximum ${lenMax})`;
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
  // Handle empty title
  if (!title || title.trim().length === 0) {
    return '';
  }

  const trimmedTitle = title.trim();

  switch (format) {
    case 1:
    default:
      return `(${type}) ${trimmedTitle[0].toUpperCase()}${trimmedTitle.slice(1).toLowerCase()}`;
    case 2:
      return `(${type}) ${trimmedTitle.toLowerCase()}`;
    case 3:
      return `${type}: ${trimmedTitle[0].toUpperCase()}${trimmedTitle.slice(1).toLowerCase()}`;
    case 4:
      return `${type}: ${trimmedTitle.toLowerCase()}`;
    case 5:
      return `${type}(${scope}) ${trimmedTitle[0].toUpperCase()}${trimmedTitle.slice(1).toLowerCase()}`;
    case 6:
      return `${type}(${scope}) ${trimmedTitle.toLowerCase()}`;
    case 7:
      return `${type}(${scope}): ${trimmedTitle[0].toUpperCase()}${trimmedTitle.slice(1).toLowerCase()}`;
    case 8:
      return `${type}(${scope}): ${trimmedTitle.toLowerCase()}`;
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

/** Parse and validate commit title format, auto-correct case */
const parseAndNormalizeCommitTitle = (title, config) => {
  let type, scope, message, detectedFormatGroup;

  // Try different format patterns
  const format7_8 = /^([^(]+)\(([^)]+)\):\s*(.+)$/; // type(scope): message
  const format5_6 = /^([^(]+)\(([^)]+)\)\s+(.+)$/; // type(scope) message
  const format3_4 = /^([^:]+):\s*(.+)$/; // type: message
  const format1_2 = /^\(([^)]+)\)\s+(.+)$/; // (type) message

  let match;

  if ((match = title.match(format7_8))) {
    [, type, scope, message] = match;
    detectedFormatGroup = 'type(scope):';
  } else if ((match = title.match(format5_6))) {
    [, type, scope, message] = match;
    detectedFormatGroup = 'type(scope)';
  } else if ((match = title.match(format3_4))) {
    [, type, message] = match;
    detectedFormatGroup = 'type:';
  } else if ((match = title.match(format1_2))) {
    [, type, message] = match;
    detectedFormatGroup = '(type)';
  } else {
    return { error: 'Invalid commit format. Expected format with type prefix.' };
  }

  // Verify format matches config
  let expectedFormatGroup;
  if (config.format >= 7) {
    expectedFormatGroup = 'type(scope):';
  } else if (config.format >= 5) {
    expectedFormatGroup = 'type(scope)';
  } else if (config.format >= 3) {
    expectedFormatGroup = 'type:';
  } else {
    expectedFormatGroup = '(type)';
  }

  if (detectedFormatGroup !== expectedFormatGroup) {
    const exampleTitle = formatCommitTitle(
      config.types[0].value,
      'name',
      config.format,
      config.scopes?.[0]?.value
    );
    return { error: `Wrong format. Expected: "${exampleTitle}"` };
  }

  type = type.trim();
  message = message.trim();
  if (scope) {
    scope = scope.trim();
  }

  // Validate type exists (case-insensitive)
  const validType = config.types.find(t => t.value.toLowerCase() === type.toLowerCase());
  if (!validType) {
    const validTypes = config.types.map(t => t.value).join(', ');
    return { error: `Invalid type "${type}". Valid types: ${validTypes}` };
  }

  // Validate scope if present (case-insensitive)
  let validScope = scope;
  if (scope) {
    if (!config.scopes || config.scopes.length === 0) {
      return { error: 'Scope not allowed in current format configuration' };
    }
    const foundScope = config.scopes.find(s => s.value.toLowerCase() === scope.toLowerCase());
    if (!foundScope) {
      const validScopes = config.scopes.map(s => s.value).join(', ');
      return { error: `Invalid scope "${scope}". Valid scopes: ${validScopes}` };
    }
    validScope = foundScope.value;
  }

  // Re-format with correct case
  const normalized = formatCommitTitle(validType.value, message, config.format, validScope);

  return { normalized };
};


export {
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
  parseAndNormalizeCommitTitle,
  handleCmdExec,
  log,
};
