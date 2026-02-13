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

/** Prompt with pre-filled text (editable) using readline */
const promptWithPrefill = (message, prefill, validate) => {
  return new Promise((resolve, reject) => {
    const askQuestion = (text) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const questionText = `${kleur.bold(message)}\n> `;

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


export default async function commit(config, testMode, debugMode) {
  if (!config) {
    return;
  }
  utils.log('new commit');

  if (!utils.hasStagedChanges()) {
    utils.log('No staged changes found - stage your changes with git add', 'error');
    return;
  }

  if (testMode) {
    utils.log('test mode enabled (commit will not be performed)', 'warning');
  }

  if (debugMode) {
    utils.log('debug mode enabled (additional visible logs)', 'debug');
  }

  // Get current git branch for version change option "only on release branch"
  const currentBranch = utils.getCurrentBranch();
  const askForVersion = utils.askForVersion(config, currentBranch);
  const ignoreVersion = config.changeVersion === 'ignore';

  const noType = !config.types || (config.types && config.types.length === 0);
  if (noType) {
    utils.log('no types defined - please update config', 'error');
    return;
  }

  if (config.format === 'custom') {
    const formatValid = utils.validateCustomFormatPattern(config.customFormat);
    if (formatValid !== true) {
      utils.log(`Invalid custom format - ${formatValid}`, 'error');
      return;
    }
  }

  const formatNeedsScope = config.format === 'custom'
    ? utils.customFormatHasScope(config.customFormat)
    : config.format >= 5;

  const noScope = !config.scopes || (config.scopes && config.scopes.length === 0);
  if (formatNeedsScope && noScope) {
    utils.log('no scopes defined - update config or format option', 'error');
    return;
  }

  // Warn if using default example scope and skip AI suggestions
  const hasDefaultScope = config.scopes && config.scopes.length === 1 && config.scopes[0].value === 'example';
  if (hasDefaultScope) {
    utils.log('You are using the default scope "example" - customize your scopes in commit-config.json or run `format-commit --config`', 'warning');
    utils.log('AI suggestions skipped - configure your scopes', 'warning');
  }

  // Collect custom field values early (needed before AI and classic flows)
  let cancelled = false;
  let customFieldValues = {};
  if (config.format === 'custom') {
    const fields = utils.getCustomFields(config.customFormat);
    for (const label of fields) {
      const resp = await prompts({
        type: 'text',
        name: 'value',
        message: `${label}?`,
        validate: v => (!v || !v.trim()) ? `${label} cannot be empty` : true,
      }, {
        onCancel: () => {
          cancelled = true;
          return false;
        },
      });
      if (cancelled) {
        utils.log('commit cancelled', 'error');
        return;
      }
      customFieldValues[label] = resp.value;
    }
  }

  let commitTitle = null;
  let useAISuggestion = false;

  if (config.ai?.enabled && !hasDefaultScope) {
    utils.log('generating suggestions...');
    const aiService = await import('./ai-service.js');
    let suggestions = [];

    try {
      suggestions = await aiService.generateCommitSuggestions(config, debugMode, customFieldValues);
    } catch (err) {
      utils.log(`AI suggestions failed (${err.message})`, 'warning');
    }

    if (suggestions?.length) {
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
              const result = utils.parseAndNormalizeCommitTitle(val, config, customFieldValues);
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
          const result = utils.parseAndNormalizeCommitTitle(rawTitle, config, customFieldValues);
          commitTitle = result.normalized;
          useAISuggestion = true;
        } catch (err) {
          if (err.message === 'cancelled') {
            utils.log('commit cancelled', 'error');
          }
          return;
        }
      }
    }
  }

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
        type: ignoreVersion ? null : (askForVersion ? null : 'confirm'),
        name: 'changeVersion',
        message: 'Change package version?',
        initial: false,
      },
      {
        type: prev => ignoreVersion ? null : (askForVersion | prev ? 'select' : null),
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
        type: testMode ? null : 'confirm',
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

  // Classic flow: ask for type and scope
  const typeScope = await prompts([
    {
      type: 'select',
      name: 'type',
      message: 'Type of changes',
      choices: config.types,
    },
    {
      type: formatNeedsScope ? 'select' : null,
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

  // Ask for title with full formatted length validation, then description, and options
  const commit = await prompts([
    {
      type: 'text',
      name: 'title',
      message: 'Commit title?',
      validate: val => {
        if (!val || val.trim().length === 0) {
          return 'Commit title cannot be empty';
        }
        const fullTitle = utils.formatCommitTitle(
          typeScope.type, val, config.format, typeScope.scope,
          config.customFormat, customFieldValues
        );
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
      type: ignoreVersion ? null : (askForVersion ? null : 'confirm'),
      name: 'changeVersion',
      message: 'Change package version?',
      initial: false,
    },
    {
      type: prev => ignoreVersion ? null : (askForVersion | prev ? 'select' : null),
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

  commitTitle = utils.formatCommitTitle(
    typeScope.type,
    commit.title,
    config.format,
    typeScope.scope,
    config.customFormat,
    customFieldValues
  );

  await finalizeCommit(commitTitle, commit.description, commit, currentBranch, testMode);
}
