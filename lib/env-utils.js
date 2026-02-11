import fs from 'fs';
import path from 'path';


/** Check if a file path is in .gitignore */
const isInGitignore = (filePath) => {
  try {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      return false;
    }
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    const lines = gitignoreContent.split('\n').map(l => l.trim());

    const normalizedPath = filePath.startsWith('./') ? filePath.slice(2) : filePath;

    return lines.some(line => {
      if (!line || line.startsWith('#')) {return false;}
      return line === normalizedPath || line === `/${normalizedPath}`;
    });
  } catch {
    return false;
  }
};

/** Add a file to .gitignore */
const addToGitignore = (filePath) => {
  try {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    const normalizedPath = filePath.startsWith('./') ? filePath.slice(2) : filePath;

    let content = '';
    if (fs.existsSync(gitignorePath)) {
      content = fs.readFileSync(gitignorePath, 'utf-8');
      if (!content.endsWith('\n')) {
        content += '\n';
      }
    }

    content += `${normalizedPath}\n`;
    fs.writeFileSync(gitignorePath, content);
    return true;
  } catch {
    return false;
  }
};

/** Check if a key exists in .env file */
const keyExistsInEnv = (envPath, keyName) => {
  try {
    if (!fs.existsSync(envPath)) {
      return false;
    }
    const content = fs.readFileSync(envPath, 'utf-8');
    const regex = new RegExp(`^${keyName}=`, 'm');
    return regex.test(content);
  } catch {
    return false;
  }
};

/** Add or update a key in .env file */
const setEnvKey = (envPath, keyName, value) => {
  try {
    let content = '';

    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf-8');
      const regex = new RegExp(`^${keyName}=.*$`, 'm');

      if (regex.test(content)) {
        content = content.replace(regex, `${keyName}=${value}`);
      } else {
        if (!content.endsWith('\n')) {content += '\n';}
        content += `${keyName}=${value}\n`;
      }
    } else {
      content = `${keyName}=${value}\n`;
    }

    fs.writeFileSync(envPath, content);
    return true;
  } catch {
    return false;
  }
};

/** Read a key from .env file */
const getEnvKey = (envPath, keyName) => {
  try {
    if (!fs.existsSync(envPath)) {
      return null;
    }
    const content = fs.readFileSync(envPath, 'utf-8');
    const regex = new RegExp(`^${keyName}=(.*)$`, 'm');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
};

export {
  isInGitignore,
  addToGitignore,
  keyExistsInEnv,
  setEnvKey,
  getEnvKey,
};
