import { execSync } from 'child_process';
import prompts from 'prompts';
import * as envUtils from './env-utils.js';
import * as utils from './utils.js';


/* global fetch */

const AI_SYSTEM_PROMPT = 'You are a commit message generator. You MUST respond with ONLY a JSON array. NO explanations. NO markdown. NO additional text whatsoever.';

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
const buildPrompt = (diffData, config) => {
  const types = config.types.map(t => `${t.value} (${t.description})`).join(', ');
  const scopes = config.scopes
    ? config.scopes.map(s => `${s.value} (${s.description})`).join(', ')
    : null;

  let formatInstruction = '';
  switch (config.format) {
    case 1:
      formatInstruction = 'Format: (type) Title with first letter capitalized';
      break;
    case 2:
      formatInstruction = 'Format: (type) title in lowercase';
      break;
    case 3:
      formatInstruction = 'Format: type: Title with first letter capitalized';
      break;
    case 4:
      formatInstruction = 'Format: type: title in lowercase';
      break;
    case 5:
      formatInstruction = 'Format: type(scope) Title with first letter capitalized';
      break;
    case 6:
      formatInstruction = 'Format: type(scope) title in lowercase';
      break;
    case 7:
      formatInstruction = 'Format: type(scope): Title with first letter capitalized';
      break;
    case 8:
      formatInstruction = 'Format: type(scope): title in lowercase';
      break;
  }

  const exampleTitle = utils.formatCommitTitle(
    config.types[0].value,
    'example change description',
    config.format,
    config.scopes?.[0]?.value
  );

  return `You must analyze git changes and return ONLY a valid JSON array. NO explanations, NO markdown, NO additional text.

Git diff stats:
${diffData.stats}

Git diff:
${diffData.diff}

STRICT REQUIREMENTS:
- ${formatInstruction}
- Example format: "${exampleTitle}"
- Available types: ${types}
${scopes ? `- Available scopes: ${scopes}` : '- No scopes - DO NOT include scope in output'}
- Length: ${config.minLength}-${config.maxLength} chars per title
- Return exactly 4 different commit titles
- Output MUST be a raw JSON array with NO text before or after

YOUR RESPONSE MUST BE EXACTLY THIS FORMAT (no other text):
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
  return data.content[0].text;
};

/** Call OpenAI API */
const callOpenAIAPI = async (prompt, apiKey, model) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: AI_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
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
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

/** Validate and normalize AI suggestion */
const validateAndNormalizeSuggestion = (suggestion, config) => {
  const result = utils.parseAndNormalizeCommitTitle(suggestion, config);

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
const generateCommitSuggestions = async (config, testMode) => {
  try {
    const diffData = getOptimizedGitDiff();
    if (!diffData) {
      return [];
    }

    const apiKey = envUtils.getEnvKey(config.ai.envPath, config.ai.envKeyName);
    if (!apiKey) {
      utils.log('AI API key not found in .env', 'warning');
      return [];
    }

    const prompt = buildPrompt(diffData, config);
    const estimatedTokens = Math.ceil(prompt.length / 4);
    const threshold = config.ai.largeDiffTokenThreshold || 20000;

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

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      if (testMode) {
        utils.log(responseText, 'warning');
      }
      throw new Error('No JSON array found in AI response');
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(suggestions) || suggestions.length !== 4) {
      throw new Error('Invalid AI response format');
    }

    // Validate and normalize each suggestion
    const validSuggestions = suggestions
      .map(s => validateAndNormalizeSuggestion(s, config))
      .filter(s => s !== null);

    if (validSuggestions.length === 0) {
      utils.log('All AI suggestions were invalid', 'warning');
      return [];
    }

    return validSuggestions;

  } catch (error) {
    utils.log(`AI suggestion failed: ${error.message}`, 'warning');
    return [];
  }
};

export {
  generateCommitSuggestions,
};
