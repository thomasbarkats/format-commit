import prompts from 'prompts';
import kleur from 'kleur';
import fs, { readFileSync } from 'fs';
import * as utils from './utils.js';
import * as envUtils from './env-utils.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const defaultConfig = JSON.parse(
  readFileSync(join(__dirname, 'default-config.json'), 'utf-8')
);
const options = JSON.parse(
  readFileSync(join(__dirname, 'options.json'), 'utf-8')
);


export default async function setup(askForCommitAfter) {
  utils.log('create config file');

  // Get current git branch to pre-fill release branch option
  const currentBranch = utils.getCurrentBranch();

  let cancelled = false;
  const configChoices = await prompts([
    {
      type: 'select',
      name: 'format',
      message: 'Commit messages nomenclature',
      choices: [
        ...options.commitFormats,
        { value: 'custom', title: kleur.gray('Custom - define your own pattern') },
      ],
    },
    {
      type: prev => prev === 'custom' ? 'text' : null,
      name: 'customFormat',
      message: 'Custom format pattern (e.g. `{Issue ID} - type - scope - Name`)',
      validate: val => utils.validateCustomFormatPattern(val),
    },
    {
      type: 'select',
      name: 'branchFormat',
      message: 'Branch names nomenclature',
      choices: options.branchFormats,
    },
    {
      type: 'number',
      name: 'minLength',
      message: 'Commit messages minimum length?',
      validate: val => utils.validCommitTitleSetupLength(val),
      initial: defaultConfig.minLength,
    },
    {
      type: 'number',
      name: 'maxLength',
      message: 'Commit messages maximum length?',
      validate: val => utils.validCommitTitleSetupLength(val),
      initial: defaultConfig.maxLength,
    },
    {
      type: 'select',
      name: 'changeVersion',
      message: 'Change package version when committing',
      choices: options.versionChangeMode,
    },
    {
      type: prev => prev === 'releaseBranch' ? 'text' : null,
      name: 'releaseBranch',
      message: 'Release git branch?',
      initial: currentBranch,
    },
    {
      type: 'confirm',
      name: 'showAllVersionTypes',
      message: 'Display all npm version types?',
      initial: defaultConfig.showAllVersionTypes,
    },
    {
      type: 'confirm',
      name: 'enableAI',
      message: 'Enable AI commit title suggestions? (API key required)',
      initial: false,
    },
    {
      type: prev => prev ? 'select' : null,
      name: 'aiProvider',
      message: 'AI provider',
      choices: options.aiProviders,
    },
    {
      type: prev => prev ? 'select' : null,
      name: 'aiModel',
      message: 'AI model',
      choices: (prev, values) => {
        const provider = options.aiProviders.find(p => p.value === values.aiProvider);
        return provider ? provider.models : [];
      },
    },
    {
      type: (prev, values) => values.enableAI ? 'text' : null,
      name: 'envPath',
      message: 'Path to .env file for API key (will be created if doesn\'t exist)',
      initial: '.env',
      validate: (val) => {
        if (!val || val.trim().length === 0) {
          return 'Please provide a .env file path';
        }

        const envPath = val.trim();
        const envExists = fs.existsSync(envPath);

        // If .env exists, check that it is in .gitignore
        if (envExists && !envUtils.isInGitignore(envPath)) {
          return `${envPath} must be in .gitignore for security. Please add it first.`;
        }

        return true;
      },
    },
    {
      type: (prev, values) => {
        if (!values.enableAI) { return null; }
        return fs.existsSync(values.envPath) ? 'text' : null;
      },
      name: 'envKeyName',
      message: 'Name of the API key variable in .env (leave empty to create new)',
      initial: (prev, values) => `${values.aiProvider.toUpperCase()}_API_KEY`,
      validate: (val) => {
        if (!val || val.trim().length === 0) {
          return 'Please provide a variable name';
        }
        return true;
      },
    },
    {
      type: (prev, values) => {
        if (!values.enableAI) { return null; }

        const keyName = values.envKeyName || `${values.aiProvider.toUpperCase()}_API_KEY`;
        const keyExists = envUtils.keyExistsInEnv(values.envPath, keyName);

        if (keyExists) {
          return 'confirm';
        }

        return null;
      },
      name: 'updateApiKey',
      message: (prev, values) => {
        const keyName = values.envKeyName || `${values.aiProvider.toUpperCase()}_API_KEY`;
        const keyExists = envUtils.keyExistsInEnv(values.envPath, keyName);

        if (keyExists) {
          return `${keyName} already exists in ${values.envPath}. Update it?`;
        }
        const providerNames = { anthropic: 'Anthropic', openai: 'OpenAI', google: 'Google' };
        return `Enter your ${providerNames[values.aiProvider] || values.aiProvider} API key`;
      },
      initial: false,
    },
    {
      type: (prev, values) => {
        if (!values.enableAI) { return null; }

        const keyName = values.envKeyName || `${values.aiProvider.toUpperCase()}_API_KEY`;
        const keyExists = envUtils.keyExistsInEnv(values.envPath, keyName);

        if (!keyExists || prev === true) {
          return 'password';
        }

        return null;
      },
      name: 'apiKey',
      message: (prev, values) => {
        const providerNames = { anthropic: 'Anthropic', openai: 'OpenAI', google: 'Google' };
        return `Enter your ${providerNames[values.aiProvider] || values.aiProvider} API key`;
      },
      validate: (val) => {
        if (!val || val.trim().length < 20) {
          return 'Please provide a valid API key';
        }
        return true;
      },
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

  if (cancelled) {
    utils.log('setup cancelled', 'error');
    return;
  }

  // Parse prompt data and write config file
  const needsScope = (
    (configChoices.format !== 'custom' && configChoices.format >= 5) ||
    (configChoices.format === 'custom' && utils.customFormatHasScope(configChoices.customFormat)) ||
    configChoices.branchFormat === 2
  );

  const config = {
    format: configChoices.format,
    customFormat: configChoices.format === 'custom' ? configChoices.customFormat : undefined,
    branchFormat: configChoices.branchFormat,
    types: defaultConfig.types,
    scopes: needsScope ? defaultConfig.scopes : undefined,
    minLength: configChoices.minLength,
    maxLength: configChoices.maxLength,
    changeVersion: configChoices.changeVersion,
    releaseBranch: configChoices.releaseBranch,
    showAllVersionTypes: configChoices.showAllVersionTypes,
  };

  // Handle AI configuration
  if (configChoices.enableAI) {
    const envPath = configChoices.envPath;
    const keyName = configChoices.envKeyName || `${configChoices.aiProvider.toUpperCase()}_API_KEY`;

    if (configChoices.apiKey) {
      const saved = envUtils.setEnvKey(envPath, keyName, configChoices.apiKey);
      if (!saved) {
        utils.log(`Failed to save API key to ${envPath}`, 'error');
        return;
      }
      utils.log(`API key saved to ${envPath}`, 'success');
    }

    if (!envUtils.isInGitignore(envPath)) {
      const added = envUtils.addToGitignore(envPath);
      if (added) {
        utils.log(`${envPath} added to .gitignore`, 'success');
      } else {
        utils.log(`Failed to add ${envPath} to .gitignore`, 'warning');
      }
    }

    config.ai = {
      enabled: true,
      provider: configChoices.aiProvider,
      model: configChoices.aiModel,
      envPath: envPath,
      envKeyName: keyName,
      largeDiffTokenThreshold: defaultConfig.ai.largeDiffTokenThreshold,
    };
  } else {
    config.ai = {
      enabled: false,
      largeDiffTokenThreshold: defaultConfig.ai.largeDiffTokenThreshold,
    };
  }

  const parsedConfig = JSON.stringify(config, null, 2);

  utils.log(`save ${options.configFile}.json file...`);

  try {
    fs.writeFileSync(`./${options.configFile}.json`, parsedConfig);
    utils.log('config file successfully created', 'success');
    utils.log(`Customize default types and scopes in ${options.configFile}.json`);
  } catch (err) {
    utils.log(`Unable to save config file: ${err.message}`, 'error');
    return;
  }

  return {
    config,
    commitAfter: configChoices.commitAfter
  };
}
