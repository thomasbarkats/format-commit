import prompts from 'prompts';
import kleur from 'kleur';
import readline from 'readline';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as utils from './utils.js';


const { gray } = kleur;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = JSON.parse(
  readFileSync(join(__dirname, 'options.json'), 'utf-8')
);


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
    const exampleTitle = utils.formatCommitTitle(
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
  const normalized = utils.formatCommitTitle(validType.value, message, config.format, validScope);

  return { normalized };
};

/** Prompt with pre-filled text (editable) using readline */
const promptWithPrefill = (message, prefill, validate) => {
  return new Promise((resolve, reject) => {
    const askQuestion = (text) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const questionText = `${kleur.bold(message)}\n› `;

      // Handle Ctrl+C to cancel
      rl.on('SIGINT', () => {
        rl.close();
        console.log('');
        reject(new Error('cancelled'));
      });

      rl.question(questionText, (answer) => {
        rl.close();

        const validation = validate ? validate(answer) : true;
        if (validation !== true) {
          utils.log(validation, 'error');
          // Ask again with current answer as prefill
          askQuestion(answer);
          return;
        }

        resolve(answer);
      });

      rl.write(text);
    };

    askQuestion(prefill);
  });
};


/** Execute commit, handle version bump, push and show status */
const finalizeCommit = async (title, description, commitData, currentBranch, testMode) => {
  utils.log('commit changes...');

  if (testMode) {
    utils.log(title, 'warning');
    return;
  }

  const commitRes = utils.handleCmdExec(`git commit -m "${title}" -m "${description}"`);
  if (!commitRes) {
    return;
  }
  utils.log('commit successfully completed', 'success');
  console.log(commitRes);

  let newVersion = null;
  if (commitData.version === 'prerelease') {
    const preRelease = await prompts([
      {
        type: 'text',
        name: 'tag',
        message: 'Pre-release tag?',
      },
    ]);
    utils.log('update version...');
    newVersion = utils.handleCmdExec(`npm version ${commitData.version} --preid=${preRelease.tag}`);
  } else if (commitData.version) {
    utils.log('update version...');
    const version = commitData.customVersion ? commitData.customVersion : commitData.version;
    newVersion = utils.handleCmdExec(`npm version ${version} --allow-same-version`);
  }

  if (newVersion) {
    utils.log(`package updated to ${newVersion}`);
  }

  if (commitData.pushAfterCommit) {
    utils.log('push changes...');
    const gitPush = utils.handleCmdExec(`git push -u origin ${currentBranch}`);
    console.log(gitPush);
  }
  const gitStatus = utils.handleCmdExec('git status');
  console.log(gitStatus);
};


export default async function commit(config, testMode) {
  if (!config) {
    return;
  }
  utils.log('new commit');

  if (!testMode && !utils.hasStagedChanges()) {
    utils.log('No staged changes found - stage your changes with git add', 'error');
    return;
  }

  if (testMode) {
    utils.log('test mode enabled - commit will not be performed', 'warning');
  }

  // Get current git branch for version change option "only on release branch"
  const currentBranch = utils.getCurrentBranch();
  const askForVersion = utils.askForVersion(config, currentBranch);

  const noType = !config.types || (config.types && config.types.length === 0);
  if (noType) {
    utils.log('no types defined - please update config', 'error');
    return;
  }

  const noScope = !config.scopes || (config.scopes && config.scopes.length === 0);
  if (config.format >= 5 && noScope) {
    utils.log('no scopes defined - update config or format option', 'error');
    return;
  }

  let commitTitle = null;
  let useAISuggestion = false;

  // Try to generate AI suggestions if enabled
  if (config.ai?.enabled) {
    utils.log('generating suggestions...');
    const aiService = await import('./ai-service.js');
    const suggestions = await aiService.generateCommitSuggestions(config, testMode);

    if (suggestions && suggestions.length === 4) {
      let aiCancelled = false;
      const aiChoice = await prompts({
        type: 'select',
        name: 'selectedTitle',
        message: 'Start with a suggested title?',
        choices: [
          ...suggestions.map(s => ({ title: s, value: s })),
          { title: gray('Custom (enter manually)'), value: '__custom__' },
        ],
      }, {
        onCancel: () => {
          aiCancelled = true;
          return false;
        },
      });

      if (aiCancelled) {
        utils.log('commit cancelled', 'error');
        return;
      }

      if (aiChoice.selectedTitle && aiChoice.selectedTitle !== '__custom__') {
        try {
          const rawTitle = await promptWithPrefill(
            'Edit commit title or continue:',
            aiChoice.selectedTitle,
            val => {
              if (!val || val.trim().length === 0) {
                return 'Commit title cannot be empty';
              }

              // Parse and validate format, type, and scope
              const result = parseAndNormalizeCommitTitle(val, config);
              if (result.error) {
                return result.error;
              }

              // Validate length of normalized title
              const lengthCheck = utils.validCommitTitle(result.normalized, config.minLength, config.maxLength);
              if (lengthCheck !== true) {
                return lengthCheck;
              }

              return true;
            }
          );

          // Normalize the final title (correct case)
          const result = parseAndNormalizeCommitTitle(rawTitle, config);
          commitTitle = result.normalized;
          useAISuggestion = true;
        } catch (err) {
          if (err.message === 'cancelled') {
            utils.log('commit cancelled', 'error');
          }
          return;
        }
      }
    } else {
      utils.log('AI suggestions failed, using manual input', 'warning');
    }
  }

  let cancelled = false;

  // If AI suggestion was accepted, only ask for description, version, and push
  if (useAISuggestion) {
    const commit = await prompts([
      {
        type: 'text',
        name: 'description',
        message: 'Commit description?',
        validate: val => val.length > 255 ? 'Commit description too long' : true,
      },
      {
        type: askForVersion ? null : 'confirm',
        name: 'changeVersion',
        message: 'Change package version?',
        initial: false,
      },
      {
        type: prev => askForVersion | prev ? 'select' : null,
        name: 'version',
        message: 'Type of version change',
        choices: config.showAllVersionTypes
          ? [...options.versionTypes, ...options.allVersionTypes]
          : options.versionTypes,
      },
      {
        type: prev => prev === 'custom' ? 'text' : null,
        name: 'customVersion',
        message: 'Version?',
        validate: val => utils.validVersion(val),
      },
      {
        type: 'confirm',
        name: 'pushAfterCommit',
        message: 'Push changes?',
        initial: false,
      },
    ], {
      onCancel: () => {
        cancelled = true;
        return false;
      },
    });

    if (cancelled) {
      utils.log('commit cancelled', 'error');
      return;
    }

    await finalizeCommit(commitTitle, commit.description, commit, currentBranch, testMode);
    return;
  }

  // Classic flow: ask for type and scope first
  const typeScope = await prompts([
    {
      type: 'select',
      name: 'type',
      message: 'Type of changes',
      choices: config.types,
    },
    {
      type: config.format >= 5 ? 'select' : null,
      name: 'scope',
      message: 'Scope',
      choices: config.scopes,
    },
  ], {
    onCancel: () => {
      cancelled = true;
      return false;
    },
  });

  if (cancelled) {
    utils.log('commit cancelled', 'error');
    return;
  }

  // Ask for title with full formatted length validation, then description, version and push
  const commit = await prompts([
    {
      type: 'text',
      name: 'title',
      message: 'Commit title?',
      validate: val => {
        if (!val || val.trim().length === 0) {
          return 'Commit title cannot be empty';
        }
        const fullTitle = utils.formatCommitTitle(typeScope.type, val, config.format, typeScope.scope);
        return utils.validCommitTitle(fullTitle, config.minLength, config.maxLength);
      },
    },
    {
      type: 'text',
      name: 'description',
      message: 'Commit description?',
      validate: val => val.length > 255 ? 'Commit description too long' : true,
    },
    {
      type: askForVersion ? null : 'confirm',
      name: 'changeVersion',
      message: 'Change package version?',
      initial: false,
    },
    {
      type: prev => askForVersion | prev ? 'select' : null,
      name: 'version',
      message: 'Type of version change',
      // Display only some npm version options or all depending on config
      choices: config.showAllVersionTypes
        ? [...options.versionTypes, ...options.allVersionTypes]
        : options.versionTypes,
    },
    {
      type: prev => prev === 'custom' ? 'text' : null,
      name: 'customVersion',
      message: 'Version?',
      validate: val => utils.validVersion(val),
    },
    {
      type: 'confirm',
      name: 'pushAfterCommit',
      message: 'Push changes?',
      initial: false,
    },
  ], {
    onCancel: () => {
      cancelled = true;
      return false;
    },
  });

  if (cancelled) {
    utils.log('commit cancelled', 'error');
    return;
  }

  // Format changes message and commit it
  commitTitle = utils.formatCommitTitle(
    typeScope.type,
    commit.title,
    config.format,
    typeScope.scope
  );

  await finalizeCommit(commitTitle, commit.description, commit, currentBranch, testMode);
}
