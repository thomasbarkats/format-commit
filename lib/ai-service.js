'use strict';

const { execSync } = require('child_process');
const prompts = require('prompts');
const envUtils = require('./env-utils');
const utils = require('./utils');


/* global fetch */

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
      system: 'You are a commit message generator. You MUST respond with ONLY a JSON array. NO explanations. NO markdown. NO additional text whatsoever.',
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
          content: 'You are a commit message generator. You MUST respond with ONLY a JSON array. NO explanations. NO markdown. NO additional text whatsoever.',
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
  const systemPrompt = 'You are a commit message generator. You MUST respond with ONLY a JSON array. NO explanations. NO markdown. NO additional text whatsoever.';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
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

/** Validate a commit suggestion */
const validateSuggestion = (suggestion, config) => {
  if (suggestion.length < config.minLength || suggestion.length > config.maxLength) {
    return false;
  }

  // Check that the suggestion contains a valid type
  const validTypes = config.types.map(t => t.value);
  const hasValidType = validTypes.some(type => {
    return suggestion.includes(type);
  });

  return hasValidType;
};

/** Generate commit title suggestions using AI */
const generateCommitSuggestions = async (config) => {
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
      utils.log(responseText, 'warning');
      throw new Error('No JSON array found in AI response');
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(suggestions) || suggestions.length !== 4) {
      throw new Error('Invalid AI response format');
    }

    const validSuggestions = suggestions.filter(s => validateSuggestion(s, config));

    if (validSuggestions.length < 4) {
      utils.log('Some AI suggestions were invalid', 'warning');
      return [];
    }

    return validSuggestions;

  } catch (error) {
    utils.log(`AI suggestion failed: ${error.message}`, 'warning');
    return [];
  }
};

module.exports = {
  generateCommitSuggestions,
};
