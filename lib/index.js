#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const fs = require('fs');
const utils = require('./utils');
const setup = require('./setup');
const commit = require('./commit');
const options = require('./options.json');

program.option('-c, --config', 'generate a configuration file on your project for format-commit');
program.option('-t, --test', 'start script without finalize commit (for tests)');
program.parse(process.argv);

(async () => {
    if (program.config) {
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
                commit(setupResult.config, program.test);
            }
        } else {
            commit(JSON.parse(data), program.test);
        }
    });
})();
