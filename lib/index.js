#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const fs = require('fs');
const utils = require('./utils');
const setup = require('./setup');
const commit = require('./commit');
const options = require('./options.json');

program.option('-c, --config', 'generate a configuration file on your project for format-commit');
program.parse(process.argv);

(async () => {
    if (program.config) {
        await setup();
        return;
    }
    /**
     * Get config from consumer package root
     * Generate new config file if not founded
     */
    fs.readFile(`./${options.configFile}.json`, async (err, data) => {
        if (err) {
            utils.log('no configuration found', 'warning');
            const setupResult = await setup(options);
            if (setupResult && setupResult.commitAfter) {
                commit(options, setupResult.config);
            }
        } else {
            commit(options, JSON.parse(data));
        }
    });
})();
