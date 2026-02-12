#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import * as utils from './utils.js';
import setup from './setup.js';
import commit from './commit.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = JSON.parse(
  readFileSync(join(__dirname, 'options.json'), 'utf-8')
);


const program = new Command();

program
  .name('format-commit')
  .description('CLI to standardize commit nomenclature')
  .version('0.3.1')
  .option('-b, --branch', 'create a new branch with standardized naming')
  .option('-c, --config', 'generate a configuration file on your project for format-commit')
  .option('-t, --test', 'start without finalize commit (for tests)')
  .option('-d, --debug', 'display additional logs');

try {
  program.parse(process.argv);
} catch (err) {
  console.error('Error parsing arguments:', err.message);
  process.exit(1);
}

(async () => {
  const opts = program.opts();

  if (opts.config) {
    await setup(false);
    return;
  }

  // Get config from consumer package root, generate new config file if not found
  fs.readFile(`./${options.configFile}.json`, async (err, data) => {
    if (err) {
      utils.log('no configuration found', 'warning');
      const setupResult = await setup(true);
      if (setupResult && setupResult.commitAfter) {
        commit(setupResult.config, opts.test, opts.debug);
      }
    } else {
      if (opts.branch) {
        const { default: createBranch } = await import('./create-branch.js');
        createBranch(JSON.parse(data), opts.test);
        return;
      }
      commit(JSON.parse(data), opts.test, opts.debug);
    }
  });
})();
