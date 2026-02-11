import prompts from 'prompts';
import kleur from 'kleur';
import * as utils from './utils.js';

const { gray } = kleur;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = JSON.parse(
  readFileSync(join(__dirname, 'options.json'), 'utf-8')
);


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
    utils.log('generating AI suggestions...');
    const aiService = await import('./ai-service.js');
    const suggestions = await aiService.generateCommitSuggestions(config, testMode);

    if (suggestions && suggestions.length === 4) {
      let aiCancelled = false;
      const aiChoice = await prompts({
        type: 'select',
        name: 'selectedTitle',
        message: 'Choose a commit title',
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
        commitTitle = aiChoice.selectedTitle;
        useAISuggestion = true;
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
