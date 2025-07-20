#!/usr/bin/env node
'use strict';

const { Command } = require('commander');
const fs = require('fs');
const utils = require('./utils');
const setup = require('./setup');
const commit = require('./commit');
const options = require('./options.json');

const program = new Command();

program
  .name('format-commit')
  .description('CLI to standardize commit nomenclature')
  .version('0.3.1')
  .option('-b, --branch', 'create a new branch with standardized naming')
  .option('-c, --config', 'generate a configuration file on your project for format-commit')
  .option('-t, --test', 'start without finalize commit (for tests)');

try {
  program.parse(process.argv);
} catch (error) {
  console.error('Error parsing arguments:', error.message);
  process.exit(1);
}

(async () => {
  const opts = program.opts();

  if (opts.config) {
    await setup(false);
    return;
  }

  /**
   * Get config from consumer package root
   * Generate new config file if not founded
   */
  fs.readFile(`./${options.configFile}.json`, async (err, data) => {
    if (err) {
      utils.log('no configuration found', 'warning');
      const setupResult = await setup(true);
      if (setupResult && setupResult.commitAfter) {
        commit(setupResult.config, opts.test);
      }
    } else {
      if (opts.branch) {
        const createBranch = require('./create-branch');
        createBranch(JSON.parse(data), opts.test);
        return;
      }
      commit(JSON.parse(data), opts.test);
    }
  });
})();
