'use strict';

const prompts = require('prompts');
const utils = require('./utils');


module.exports = async (options, config) => {
    if (!options || !config) {
        return;
    }
    utils.log('new commit');

    /**
     * Get current git branch for version change option "only on main branch"
    */
    const currentBranch = await utils.getCurrentBranch();
    const askForVersion = utils.askForVersion(config, currentBranch);

    let cancelled = false;
    const commit = await prompts([
        {
            type: 'select',
            name: 'type',
            message: 'Type of changes',
            /**
             * Get commit allowed types from custom config if exist
             * or get default types from options file
            */
            choices: config.types ? config.types : options.commitTypes,
        },
        {
            type: 'text',
            name: 'title',
            message: 'Commit title?',
            validate: val => utils.validCommitTitle(val, config.minLength, config.maxLength),
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
            /**
             * Display only some npm version options or all depending on config
             */
            choices: config.showAllVersionTypes
                ? [...options.versionTypes, ...options.allVersionTypes]
                : options.versionTypes,
            initial: currentBranch === config.mainBranch ? 1 : 2,
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

    /**
     * Handle prompt cancellation and stop commit execution
     */
    if (cancelled) {
        utils.log('commit cancelled');
        return;
    }

    let newVersion = null;
    if (commit.version === 'prerelease') {
        /**
         * Ask tag if new version is a prerelease and update it
         */
        const preRelease = await prompts([
            {
                type: 'text',
                name: 'tag',
                message: 'Pre-release tag?',
            },
        ]);
        utils.log('update version...');
        newVersion = await utils.handleCmdExec(`npm version ${commit.version} --preid=${preRelease.tag}`);

    } else if (commit.version) {
        /**
         * Ask version if custom option selected and update it
         */
        utils.log('update version...');
        const version = commit.customVersion ? commit.customVersion : commit.version;
        newVersion = await utils.handleCmdExec(`npm version ${version} --allow-same-version`);
    }
    if (newVersion) {
        utils.log(`package updated to ${newVersion}`);
    }

    /**
     * Format changes message and commit it
     */
    utils.log('commit changes...');
    const commitTitle = utils.formatCommitTitle(commit.type, commit.title, config.format);
    const commitRes = await utils.handleCmdExec(`git commit -A -m $'${commitTitle}\\n\\n${commit.description}'`);
    if (!commitRes) {
        return;
    }
    utils.log('commit successfully completed', 'success');
    console.log(commitRes);

    /**
     * Push commit if option selection
     */
    if (commit.pushAfterCommit) {
        utils.log('push changes...');
        const gitPush = await utils.handleCmdExec(`git push -u origin ${currentBranch}`);
        console.log(gitPush);
    }
    const gitStatus = await utils.handleCmdExec('git status');
    console.log(gitStatus);
};
