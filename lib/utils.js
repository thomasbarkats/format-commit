import { execSync } from 'child_process';
import kleur from 'kleur';
import { magenta } from 'kleur/colors';


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

const applyCasing = (value, casing) => {
  switch (casing) {
    case 'lower': return value.toLowerCase();
    case 'upper': return value.toUpperCase();
    case 'capitalize': return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    default: return value;
  }
};

const detectCasing = (word) => {
  if (word === word.toLowerCase()) { return 'lower'; }
  if (word === word.toUpperCase()) { return 'upper'; }
  return 'capitalize';
};

const parseCustomFormat = (pattern) => {
  const regex = /\{([^}]+)\}|\b(type|scope|description)\b/gi;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(pattern)) !== null) {
    // Add literal text before this match
    if (match.index > lastIndex) {
      segments.push({ type: 'literal', value: pattern.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      // {field} placeholder
      segments.push({ type: 'field', label: match[1] });
    } else {
      // keyword (type, scope, description)
      segments.push({
        type: 'keyword',
        keyword: match[2].toLowerCase(),
        case: detectCasing(match[2]),
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add trailing literal text
  if (lastIndex < pattern.length) {
    segments.push({ type: 'literal', value: pattern.slice(lastIndex) });
  }

  return segments;
};

const customFormatHasScope = (pattern) => /\bscope\b/i.test(pattern);

const customBranchFormatHasScope = (pattern) => customFormatHasScope(pattern);

const getCustomFields = (pattern) => {
  const fields = [];
  const regex = /\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(pattern)) !== null) {
    fields.push(match[1]);
  }
  return fields;
};

const validateCustomFormatPattern = (pattern) => {
  if (!pattern || !pattern.trim()) {
    return 'Pattern cannot be empty';
  }
  if (!/\btype\b/i.test(pattern)) {
    return 'Pattern must contain the "type" keyword';
  }
  if (!/\bdescription\b/i.test(pattern)) {
    return 'Pattern must contain the "description" keyword';
  }
  // Check balanced braces
  let depth = 0;
  for (const ch of pattern) {
    if (ch === '{') { depth++; }
    if (ch === '}') { depth--; }
    if (depth < 0) { return 'Unbalanced braces in pattern'; }
  }
  if (depth !== 0) { return 'Unbalanced braces in pattern'; }
  return true;
};

const parseCustomBranchFormat = (pattern) => {
  const regex = /\{([^}]+)\}|\b(type|scope|description)\b/gi;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(pattern)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'literal', value: pattern.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      segments.push({ type: 'field', label: match[1] });
    } else {
      segments.push({
        type: 'keyword',
        keyword: match[2].toLowerCase(),
        case: detectCasing(match[2]),
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < pattern.length) {
    segments.push({ type: 'literal', value: pattern.slice(lastIndex) });
  }

  return segments;
};

const validateCustomBranchFormatPattern = (pattern) => {
  if (!pattern || !pattern.trim()) {
    return 'Pattern cannot be empty';
  }
  if (!/\btype\b/i.test(pattern)) {
    return 'Pattern must contain the "type" keyword';
  }
  if (!/\bdescription\b/i.test(pattern)) {
    return 'Pattern must contain the "description" keyword';
  }
  // Check balanced braces
  let depth = 0;
  for (const ch of pattern) {
    if (ch === '{') { depth++; }
    if (ch === '}') { depth--; }
    if (depth < 0) { return 'Unbalanced braces in pattern'; }
  }
  if (depth !== 0) { return 'Unbalanced braces in pattern'; }
  // Validate literal parts (separators) are branch-safe
  const segments = parseCustomBranchFormat(pattern);
  const invalidBranchChars = /[~^:?*[\\\s]/;
  for (const seg of segments) {
    if (seg.type !== 'literal') { continue; }
    if (invalidBranchChars.test(seg.value)) {
      return 'Pattern contains characters invalid in branch names (spaces, ~, ^, :, ?, *, [, \\)';
    }
    if (seg.value.includes('..')) {
      return 'Pattern cannot contain ".." (invalid in branch names)';
    }
    if (seg.value.includes('//')) {
      return 'Pattern cannot contain "//" (invalid in branch names)';
    }
  }
  return true;
};

const getCustomBranchFields = (pattern) => getCustomFields(pattern);

const sanitizeBranchPart = (value) => {
  return value
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const formatCustomBranchName = (type, description, segments, scope, customFieldValues = {}) => {
  return segments.map(seg => {
    if (seg.type === 'literal') { return seg.value; }
    if (seg.type === 'field') { return sanitizeBranchPart(customFieldValues[seg.label] || ''); }
    if (seg.type === 'keyword') {
      switch (seg.keyword) {
        case 'type': return applyCasing(type, seg.case);
        case 'scope': return applyCasing(scope || '', seg.case);
        case 'description': return applyCasing(sanitizeBranchPart(description), seg.case);
      }
    }
    return '';
  }).join('');
};

const formatCustomCommitTitle = (type, description, segments, scope, customFieldValues = {}) => {
  return segments.map(seg => {
    if (seg.type === 'literal') { return seg.value; }
    if (seg.type === 'field') { return customFieldValues[seg.label] || ''; }
    if (seg.type === 'keyword') {
      switch (seg.keyword) {
        case 'type': return applyCasing(type, seg.case);
        case 'scope': return applyCasing(scope || '', seg.case);
        case 'description': return applyCasing(description, seg.case);
      }
    }
    return '';
  }).join('');
};

const formatCommitTitle = (type, title, format, scope = '*', customFormat, customFieldValues) => {
  // Handle empty title
  if (!title || title.trim().length === 0) {
    return '';
  }

  const trimmedTitle = title.trim();

  if (format === 'custom' && customFormat) {
    const segments = parseCustomFormat(customFormat);
    return formatCustomCommitTitle(type, trimmedTitle, segments, scope, customFieldValues);
  }

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
    case 'debug':
      msg = magenta(msg);
      break;
  }
  console.log(`${date} ${type === 'error' ? red(msg) : (type === 'success' ? green(msg) : msg)}`);
};

const validBranchCustomField = (value, label) => {
  if (!value || value.trim().length < 1) {
    return `${label} cannot be empty`;
  }
  const invalidChars = /[~^:?*[\\\s]/;
  if (invalidChars.test(value)) {
    return `${label} contains invalid characters (spaces, ~, ^, :, ?, *, [, \\)`;
  }
  if (value.startsWith('.') || value.startsWith('-') ||
    value.endsWith('.') || value.endsWith('-')) {
    return `${label} cannot start or end with . or -`;
  }
  return true;
};

const validBranchDescription = (description, maxLength) => {
  const base = validBranchCustomField(description, 'Branch description');
  if (base !== true) { return base; }
  if (description.length > maxLength) {
    return `Branch description too long (max ${maxLength} characters)`;
  }
  return true;
};

const formatBranchName = (type, description, format, scope = null, customBranchFormat = null, customFieldValues = {}) => {
  if (format === 'custom' && customBranchFormat) {
    const segments = parseCustomBranchFormat(customBranchFormat);
    return formatCustomBranchName(type, description, segments, scope, customFieldValues);
  }

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
const parseAndNormalizeCommitTitle = (title, config, customFieldValues = {}) => {
  // Custom format parsing
  if (config.format === 'custom' && config.customFormat) {
    const segments = parseCustomFormat(config.customFormat);

    // Build dynamic regex from segments
    const captureNames = [];
    let regexParts = [];
    const captureSegments = segments.filter(s => s.type === 'keyword' || s.type === 'field');

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.type === 'literal') {
        regexParts.push(seg.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      } else if (seg.type === 'keyword' || seg.type === 'field') {
        const isLast = captureSegments.indexOf(seg) === captureSegments.length - 1;
        captureNames.push(seg);
        regexParts.push(isLast ? '(.+)' : '(.+?)');
      }
    }

    const dynamicRegex = new RegExp('^' + regexParts.join('') + '$');
    const match = title.match(dynamicRegex);

    if (!match) {
      const exampleTitle = formatCommitTitle(
        config.types[0].value, 'description', config.format,
        config.scopes?.[0]?.value, config.customFormat, customFieldValues
      );
      return { error: `Wrong format. Expected: "${exampleTitle}"` };
    }

    let type, scope, message;
    const fieldValues = {};

    for (let i = 0; i < captureNames.length; i++) {
      const seg = captureNames[i];
      const val = match[i + 1].trim();
      if (seg.type === 'keyword') {
        switch (seg.keyword) {
          case 'type': type = val; break;
          case 'scope': scope = val; break;
          case 'description': message = val; break;
        }
      } else if (seg.type === 'field') {
        fieldValues[seg.label] = val;
      }
    }

    // Validate type
    if (!type) {
      return { error: 'Could not detect type in commit title' };
    }
    const validType = config.types.find(t => t.value.toLowerCase() === type.toLowerCase());
    if (!validType) {
      const validTypes = config.types.map(t => t.value).join(', ');
      return { error: `Invalid type "${type}". Valid types: ${validTypes}` };
    }

    // Validate scope if present
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

    const normalized = formatCustomCommitTitle(
      validType.value, message, segments, validScope, fieldValues
    );
    return { normalized };
  }

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
      'description',
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
  validBranchCustomField,
  validVersion,
  formatCommitTitle,
  formatBranchName,
  checkBranchExists,
  parseAndNormalizeCommitTitle,
  parseCustomFormat,
  customFormatHasScope,
  getCustomFields,
  validateCustomFormatPattern,
  parseCustomBranchFormat,
  validateCustomBranchFormatPattern,
  formatCustomBranchName,
  customBranchFormatHasScope,
  getCustomBranchFields,
  handleCmdExec,
  log,
};
