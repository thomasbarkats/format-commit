'use strict';

const { execSync } = require('child_process');
const { gray, bold, red, green, yellow } = require('kleur');


const askForVersion = (config, branch) => {
    if (
        config.changeVersion === 'always'
        || (config.changeVersion === 'releaseBranch' && branch === config.releaseBranch)
    ) {
        return true;
    }
    return false;
};

const getCurrentBranch = () => {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
};

const validCommitTitle = (title, lenMin, lenMax) => {
    if (title.length < lenMin) {
        return 'Commit title too short';
    } else if (title.length > lenMax) {
        return 'Commit title too long';
    }
    return true;
};

const validCommitTitleSetupLength = (len) => {
    if (len < 1) {
        return `${len} isn't a valid length`;
    } else if (len > 255) {
        return 'length cannot be higher than 255';
    }
    return true;
};

const validVersion = (version) => {
    const regex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    if (!regex.test(version)) {
        return 'Version does not respect semantic versioning';
    }
    return true;
};

const formatCommitTitle = (type, title, format) => {
    switch (format) {
        case 1:
        default:
            return `(${type}) ${title[0].toUpperCase()}${title.substr(1).toLowerCase()}`;
        case 2:
            return `(${type}) ${title.toLowerCase()}`;
        case 3:
            return `${type}: ${title[0].toUpperCase()}${title.substr(1).toLowerCase()}`;
        case 4:
            return `${type}: ${title.toLowerCase()}`;
    }
};

const handleCmdExec = (command) => {
    try {
        const output = execSync(command);
        return output.toString();
    } catch (err) {
        log(`Error\n${err.message ? err.message : err}`, 'error');
    }
};

const log = (message, type) => {
    const date = gray(`[${new Date().toISOString()}]`);
    let msg = `${bold('format-commit')}: ${message}`;
    switch (type) {
        case 'error':
            msg = red(msg);
            break;
        case 'success':
            msg = green(msg);
            break;
        case 'warning':
            msg = yellow(msg);
            break;
    }
    console.log(`${date} ${type === 'error' ? red(msg) : (type === 'success' ? green(msg) : msg)}`);
};


module.exports = {
    askForVersion,
    getCurrentBranch,
    validCommitTitle,
    validCommitTitleSetupLength,
    validVersion,
    formatCommitTitle,
    handleCmdExec,
    log,
};
