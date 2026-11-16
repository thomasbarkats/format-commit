import { execSync } from 'child_process';
import prompts from 'prompts';
import * as envUtils from './env-utils.js';
import * as utils from './utils.js';


/* global fetch */

const AI_SYSTEM_PROMPT = 'You are a commit message generator. Respond with a JSON array of commit-title strings only.';

const AI_RESPONSE_SCHEMA = {
  type: 'array',
  items: { type: 'string' },
};

/** Get optimized git diff */
const getOptimizedGitDiff = () => {
  try {
    const stats = execSync('git diff --cached --stat', { encoding: 'utf-8' });
    const diff = execSync(
      'git diff --cached --no-color --unified=1 -- . ":(exclude)package-lock.json" ":(exclude)*.lock" ":(exclude)*.min.*"',
      { encoding: 'utf-8', maxBuffer: 1024 * 500 }
    );

    if (!stats.trim() && !diff.trim()) {
      return null;
    }

    const lines = diff.split('\n').slice(0, 500).join('\n');
    return { stats, diff: lines };
  } catch {
    utils.log('Error getting git diff', 'error');
    return null;
  }
};

/** Build AI prompt */
const buildPrompt = (diffData, config, customFieldValues = {}) => {
  const typesList = config.types.map(t => t.value).join(', ');
  const types = config.types.map(t => `${t.value} is for ${t.description}`).join('\n   > ');
  const scopesList = config.scopes ? config.scopes.map(s => s.value).join(', ') : null;
  const scopes = config.scopes
    ? config.scopes.map(s => `${s.value} is for ${s.description}`).join('\n   > ')
    : null;

  const exampleTitle = utils.formatCommitTitle(
    config.types[0].value,
    'Description of changes',
    config.format,
    config.scopes?.[0]?.value,
    config.customFormat,
    customFieldValues
  );

  const formatHasScope = config.format === 'custom'
    ? utils.customFormatHasScope(config.customFormat)
    : config.format >= 5;

  const changeable = formatHasScope ? 'type, scope and description' : 'type and description';
  const scopeInstruction = formatHasScope ? `\n- ONLY use these scopes (do not invent one outside this list): ${scopesList}
- Scope descriptions, to figure out which one to choose:\n   > ${scopes}` : '';

  let template;
  if (config.format === 'custom' && config.customFormat) {
    const segments = utils.parseCustomFormat(config.customFormat);
    template = segments.map(seg => {
      if (seg.type === 'literal') { return seg.value; }
      if (seg.type === 'field') { return customFieldValues[seg.label] || `{${seg.label}}`; }
      if (seg.type === 'keyword') { return `<${seg.keyword}>`; }
      return '';
    }).join('');
  } else {
    template = utils.formatCommitTitle('<type>', '<description>', config.format, formatHasScope ? '<scope>' : undefined);
  }

  const formatInstruction = `- Format pattern: "${template}"
- Example: "${exampleTitle}"
- ONLY replace ${changeable} placeholders, keep everything else exactly as shown`;

  return `You must analyze git changes and return a valid JSON array of commit-title strings.

Git diff stats:
${diffData.stats}

Git diff:
${diffData.diff}

STRICT REQUIREMENTS:
${formatInstruction}
- ONLY use these types (do not invent one outside this list): ${typesList}
- Type descriptions, to figure out which one to choose:\n   > ${types}${scopeInstruction}
- Length: ${config.minLength}-${config.maxLength} chars per title
- Return exactly 4 different commit titles
- Output must be a JSON array

If changes seem to concern very different things, suggest at least one title that attempts to be exhaustive on the most important points, using commas and/or "&". Avoid generic titles such as "Bug fixes and improvements".

YOUR RESPONSE MUST BE EXACTLY THIS FORMAT:
["title 1", "title 2", "title 3", "title 4"]`;
};

/** Call Anthropic API */
const callAnthropicAPI = async (prompt, apiKey, model) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 200,
      system: AI_SYSTEM_PROMPT,
      output_config: {
        format: {
          type: 'json_schema',
          schema: AI_RESPONSE_SCHEMA,
        },
      },
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find(block => block.type === 'text');
  if (!textBlock?.text) {
    throw new Error('Anthropic API returned no text output');
  }
  return textBlock.text;
};

/** Call OpenAI API */
const callOpenAIAPI = async (prompt, apiKey, model) => {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      max_output_tokens: 200,
      instructions: AI_SYSTEM_PROMPT,
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'commit_suggestions',
          strict: true,
          schema: AI_RESPONSE_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const textBlock = data.output?.flatMap(item => item.content || [])
    .find(item => item.type === 'output_text');
  if (!textBlock?.text) {
    throw new Error('OpenAI API returned no text output');
  }
  return textBlock.text;
};

/** Call Google Gemini API */
const callGeminiAPI = async (prompt, apiKey, model) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: AI_SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 200,
          responseMimeType: 'application/json',
          responseJsonSchema: AI_RESPONSE_SCHEMA,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.find(part => part.text)?.text;
  if (!text) {
    throw new Error('Gemini API returned no text output');
  }
  return text;
};


/** Validate and normalize AI suggestion */
const validateAndNormalizeSuggestion = (suggestion, config, customFieldValues = {}) => {
  const result = utils.parseAndNormalizeCommitTitle(suggestion, config, customFieldValues);

  // Returns null if invalid format/type/scope/length
  if (result.error) {
    return null;
  }
  const lengthCheck = utils.validCommitTitle(result.normalized, config.minLength, config.maxLength);
  if (lengthCheck !== true) {
    return null;
  }

  // Returns normalized title (auto-corrected case)
  return result.normalized;
};

/** Generate commit title suggestions using AI */
const generateCommitSuggestions = async (config, debugMode, customFieldValues = {}) => {
  const diffData = getOptimizedGitDiff();
  if (!diffData) {
    return [];
  }

  const apiKey = envUtils.getEnvKey(config.ai.envPath, config.ai.envKeyName);
  if (!apiKey) {
    throw new Error('AI API key not found in .env');
  }

  const prompt = buildPrompt(diffData, config, customFieldValues);
  const estimatedTokens = Math.ceil(prompt.length / 4);
  const threshold = config.ai.largeDiffTokenThreshold || 20000;

  if (debugMode) {
    utils.log('<`git diff`>\n\n' + prompt.slice(prompt.indexOf('STRICT REQUIREMENTS:')), 'debug');
  }

  if (estimatedTokens > threshold) {
    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: `Large diff detected (~${estimatedTokens} tokens). Generate AI suggestions?`,
      initial: false,
    });
    if (!confirm) {
      return [];
    }
  }

  let responseText;
  if (config.ai.provider === 'anthropic') {
    responseText = await callAnthropicAPI(prompt, apiKey, config.ai.model);
  } else if (config.ai.provider === 'openai') {
    responseText = await callOpenAIAPI(prompt, apiKey, config.ai.model);
  } else if (config.ai.provider === 'google') {
    responseText = await callGeminiAPI(prompt, apiKey, config.ai.model);
  } else {
    throw new Error(`Unknown AI provider: ${config.ai.provider}`);
  }

  let suggestions;
  try {
    suggestions = JSON.parse(responseText);
  } catch {
    if (debugMode) {
      utils.log(responseText, 'debug');
    }
    throw new Error('Invalid JSON returned by AI provider');
  }

  if (!Array.isArray(suggestions) || !suggestions.length) {
    if (debugMode) {
      utils.log(responseText, 'debug');
    }
    throw new Error('Invalid AI response format');
  }

  // Validate and normalize each suggestion
  const validationResults = suggestions.map(s => ({
    original: s,
    normalized: validateAndNormalizeSuggestion(s, config, customFieldValues)
  }));

  // Log rejected suggestions in test mode
  if (debugMode) {
    validationResults.forEach(({ original, normalized }) => {
      if (normalized === null) {
        utils.log(`rejected: "${original}"`, 'debug');
      }
    });
  }

  const validSuggestions = validationResults
    .filter(({ normalized }) => normalized !== null)
    .map(({ normalized }) => normalized);

  if (validSuggestions.length === 0) {
    throw new Error('All AI suggestions were invalid');
  }

  return validSuggestions;
};

export {
  generateCommitSuggestions,
};
