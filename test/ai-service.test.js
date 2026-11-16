import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { generateCommitSuggestions } from '../lib/ai-service.js';


const titles = [
  '(feat) Add account settings',
  '(feat) Add profile settings',
  '(feat) Create account settings',
  '(feat) Implement account settings',
];

const responseFor = (provider) => {
  const text = JSON.stringify(titles);
  if (provider === 'anthropic') {
    return { content: [{ type: 'text', text }] };
  }
  if (provider === 'openai') {
    return { output: [{ content: [{ type: 'output_text', text }] }] };
  }
  return { candidates: [{ content: { parts: [{ text }] } }] };
};

const configFor = (provider) => ({
  format: 1,
  minLength: 8,
  maxLength: 80,
  types: [{ value: 'feat', description: 'New feature' }],
  ai: {
    provider,
    model: 'test-model',
    envPath: '.env',
    envKeyName: 'TEST_API_KEY',
    largeDiffTokenThreshold: 20000,
  },
});

test('sends structured-output requests to each AI provider', async () => {
  const originalCwd = process.cwd();
  const originalFetch = globalThis.fetch;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'format-commit-'));
  const requests = [];

  try {
    process.chdir(tempDir);
    execFileSync('git', ['init', '--quiet']);
    fs.writeFileSync('change.js', 'export const enabled = true;\n');
    fs.writeFileSync('.env', 'TEST_API_KEY=test-key\n');
    execFileSync('git', ['add', 'change.js']);

    globalThis.fetch = (url, options) => {
      const provider = url.includes('anthropic') ? 'anthropic'
        : url.includes('openai') ? 'openai' : 'google';
      requests.push({ provider, url, options: JSON.parse(options.body) });
      return Promise.resolve(new globalThis.Response(JSON.stringify(responseFor(provider)), { status: 200 }));
    };

    for (const provider of ['anthropic', 'openai', 'google']) {
      const suggestions = await generateCommitSuggestions(configFor(provider), false);
      assert.deepEqual(suggestions, titles);
    }

    const anthropic = requests.find(request => request.provider === 'anthropic');
    assert.equal(anthropic.options.output_config.format.type, 'json_schema');

    const openai = requests.find(request => request.provider === 'openai');
    assert.match(openai.url, /\/v1\/responses$/);
    assert.equal(openai.options.text.format.type, 'json_schema');
    assert.equal(openai.options.text.format.strict, true);

    const google = requests.find(request => request.provider === 'google');
    assert.equal(google.options.generationConfig.responseMimeType, 'application/json');
    assert.equal(google.options.generationConfig.responseJsonSchema.type, 'array');
  } finally {
    globalThis.fetch = originalFetch;
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
