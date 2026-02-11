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

  const noScope = !config.scopes || (config.scopes && config.scopes.length === 0);
  if (config.branchFormat === 2 && noScope) {
    utils.log('no scopes defined - update config or branch format option', 'error');
    return;
  }

  let cancelled = false;
  const branch = await prompts([
    {
      type: 'select',
      name: 'type',
      message: 'Type of branch',
      choices: config.types,
    },
    {
      type: config.branchFormat === 2 ? 'select' : null,
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
      type: 'confirm',
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

  // Format branch name and create it
  utils.log('create branch...');
  const branchName = utils.formatBranchName(
    branch.type,
    branch.description,
    config.branchFormat,
    branch.scope
  );

  if (testMode) {
    utils.log(`Branch name: ${branchName}`, 'warning');
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
