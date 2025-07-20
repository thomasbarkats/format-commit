'use strict';

const prompts = require('prompts');
const fs = require('fs');
const utils = require('./utils');
const defaultConfig = require('./default-config.json');
const options = require('./options.json');


module.exports = async (askForCommitAfter) => {
  utils.log('create config file');

  /**
   * Get current git branch to pre-fill release branch option
  */
  const currentBranch = utils.getCurrentBranch();

  let cancelled = false;
  const configChoices = await prompts([
    {
      type: 'select',
      name: 'format',
      message: 'Commit format',
      choices: options.commitFormats,
    },
    {
      type: 'number',
      name: 'minLength',
      message: 'Commit minimum length?',
      validate: val => utils.validCommitTitleSetupLength(val),
      initial: defaultConfig.minLength,
    },
    {
      type: 'number',
      name: 'maxLength',
      message: 'Commit maximum length?',
      validate: val => utils.validCommitTitleSetupLength(val),
      initial: defaultConfig.maxLength,
    },
    {
      type: 'confirm',
      name: 'stageAllChanges',
      message: 'Stage all changes before each commit?',
      initial: defaultConfig.stageAllChanges,
    },
    {
      type: 'select',
      name: 'changeVersion',
      message: 'Change package version',
      choices: options.versionChangeMode,
    },
    {
      type: prev => prev === 'releaseBranch' ? 'text' : null,
      name: 'releaseBranch',
      message: 'Release git branch ?',
      initial: currentBranch,
    },
    {
      type: 'confirm',
      name: 'showAllVersionTypes',
      message: 'Display all npm version types?',
      initial: defaultConfig.showAllVersionTypes,
    },
    {
      type: askForCommitAfter ? 'confirm' : null,
      name: 'commitAfter',
      message: 'Commit your changes now? (or exit the configuration without committing)',
      initial: false,
    },
  ], {
    onCancel: () => {
      cancelled = true;
      return false;
    },
  });

  /**
   * Handle prompt cancellation and stop setup execution
   */
  if (cancelled) {
    utils.log('setup cancelled', 'error');
    return;
  }

  /**
   * Parse prompt data and write config file
   */
  const config = {
    format: configChoices.format,
    types: defaultConfig.types,
    scopes: configChoices.format >= 5
      ? defaultConfig.scopes
      : undefined,
    minLength: configChoices.minLength,
    maxLength: configChoices.maxLength,
    changeVersion: configChoices.changeVersion,
    releaseBranch: configChoices.releaseBranch,
    showAllVersionTypes: configChoices.showAllVersionTypes,
    stageAllChanges: configChoices.stageAllChanges,
  };
  const parsedConfig = JSON.stringify(config, null, 2);

  utils.log(`save ${options.configFile}.json file...`);

  try {
    fs.writeFileSync(`./${options.configFile}.json`, parsedConfig);
    utils.log('config file successfully created', 'success');
  } catch (err) {
    utils.log(`unable to save config file: ${err}`, 'error');
    return;
  }

  return {
    config,
    commitAfter: configChoices.commitAfter
  };
};
