import prompts from 'prompts';
import * as utils from './utils.js';


export default async function createBranch(config, testMode) {
  if (!config) {
    return;
  }
  utils.log('new branch');

  if (testMode) {
    utils.log('test mode enabled - branch will not be created', 'warning');
  }

  if (!config.branchFormat) {
    utils.log('no branch format defined - please update config', 'error');
    return;
  }

  const noType = !config.types || (config.types && config.types.length === 0);
  if (noType) {
    utils.log('no types defined - please update config', 'error');
    return;
  }

  const isCustom = config.branchFormat === 'custom';
  const customHasScope = isCustom && config.customBranchFormat && utils.customBranchFormatHasScope(config.customBranchFormat);
  const needsScope = config.branchFormat === 2 || customHasScope;

  const noScope = !config.scopes || (config.scopes && config.scopes.length === 0);
  if (needsScope && noScope) {
    utils.log('no scopes defined - update config or branch format option', 'error');
    return;
  }

  if (isCustom) {
    const formatValid = utils.validateCustomBranchFormatPattern(config.customBranchFormat);
    if (formatValid !== true) {
      utils.log(`Invalid custom branch format - ${formatValid}`, 'error');
      return;
    }
  }

  // Collect custom fields if custom format
  const customFields = isCustom ? utils.getCustomBranchFields(config.customBranchFormat) : [];
  const customFieldPrompts = customFields.map(field => ({
    type: 'text',
    name: `custom_${field}`,
    message: `${field}?`,
    validate: val => utils.validBranchCustomField(val, field),
  }));

  let cancelled = false;
  const branch = await prompts([
    ...customFieldPrompts,
    {
      type: 'select',
      name: 'type',
      message: 'Type of branch',
      choices: config.types,
    },
    {
      type: needsScope ? 'select' : null,
      name: 'scope',
      message: 'Scope',
      choices: config.scopes,
    },
    {
      type: 'text',
      name: 'description',
      message: 'Branch description?',
      validate: val => utils.validBranchDescription(val, config.maxLength),
    },
    {
      type: testMode ? null : 'confirm',
      name: 'checkoutAfterCreate',
      message: 'Switch to the new branch after creation?',
      initial: true,
    },
  ], {
    onCancel: () => {
      cancelled = true;
      return false;
    },
  });

  if (cancelled) {
    utils.log('branch creation cancelled', 'error');
    return;
  }

  // Build custom field values from prompt answers
  const customFieldValues = {};
  for (const field of customFields) {
    customFieldValues[field] = branch[`custom_${field}`];
  }

  // Format branch name and create it
  utils.log('create branch...');
  const branchName = utils.formatBranchName(
    branch.type,
    branch.description,
    config.branchFormat,
    branch.scope,
    config.customBranchFormat,
    customFieldValues
  );

  if (testMode) {
    utils.log(`branch name: ${branchName}`, 'warning');
    return;
  }

  const branchExists = utils.checkBranchExists(branchName);
  if (branchExists) {
    utils.log(`branch "${branchName}" already exists`, 'error');
    return;
  }

  const createCommand = branch.checkoutAfterCreate
    ? `git checkout -b ${branchName}`
    : `git branch ${branchName}`;

  const createRes = utils.handleCmdExec(createCommand);
  if (!createRes) {
    return;
  }

  const successMessage = branch.checkoutAfterCreate
    ? `branch "${branchName}" successfully created and checked out`
    : `branch "${branchName}" successfully created`;

  utils.log(successMessage, 'success');
  console.log(createRes);

  const gitStatus = utils.handleCmdExec('git status');
  console.log(gitStatus);
}
