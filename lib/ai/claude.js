/**
 * RightsTrack AI provider.
 * Gemini is the default and only provider unless AI_PROVIDER=claude is explicitly set.
 * The historical callClaude name is retained for compatibility with existing imports.
 */

function getGeminiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

function getProviderOrder() {
  const configured = String(process.env.AI_PROVIDER || 'gemini').toLowerCase();
  return configured === 'claude' ? ['claude'] : ['gemini'];
}

function errorMessage(error) {
  if (!error) return 'unknown error';
  if (typeof error === 'string') return error;
  return error.message || error.statusText || error.status || JSON.stringify(error);
}

function getGeminiModels() {
  const configured = String(process.env.GEMINI_MODEL || '').trim();
  const retired = new Set(['gemini-2.0-flash', 'gemini-2.5-flash']);
  const preferred = configured && !retired.has(configured) ? configured : 'gemini-3.7-flash';
  return [...new Set([preferred, 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'])];
}

function getStructuredResponseSchema(systemPrompt) {
  const prompt = String(systemPrompt || '');

  if (/semantic case-fact extractor/i.test(prompt)) {
    const match = prompt.match(/Allowed fields:\s*([^\n]+)/i);
    const keys = (match?.[1] || '').split(',').map((key) => key.trim()).filter(Boolean);
    return {
      type: 'object',
      properties: Object.fromEntries(keys.map((key) => [key, { type: ['string', 'null'] }])),
      required: keys,
    };
  }

  if (/adaptive legal-intake interviewer/i.test(prompt)) {
    return {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              question: { type: 'string' },
              input_type: { type: 'string', enum: ['text', 'number', 'date'] },
              required: { type: 'boolean' },
            },
            required: ['id', 'question', 'input_type', 'required'],
          },
        },
      },
      required: ['questions'],
    };
  }

  if (/primary semantic AI classifier/i.test(prompt)) {
    return {
      type: 'object',
      properties: {
        domain: { type: 'string', enum: ['RTI', 'CONSUMER', 'OTHER'] },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        rationale: { type: 'string' },
        suggested_category: { type: 'string' },
        is_valid_problem: { type: 'boolean' },
      },
      required: ['domain', 'confidence', 'rationale', 'suggested_category', 'is_valid_problem'],
    };
  }

  if (/final semantic classification reviewer/i.test(prompt)) {
    return {
      type: 'object',
      properties: {
        supported: { type: 'boolean' },
        domain: { type: 'string', enum: ['RTI', 'CONSUMER', 'OTHER'] },
        suggested_category: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        reason: { type: 'string' },
      },
      required: ['supported', 'domain', 'suggested_category', 'confidence', 'reason'],
    };
  }

  return { type: 'object' };
}

async function callGeminiModel({ model, systemPrompt, userPrompt, temperature = 0.2, maxTokens = 2000 }) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('Gemini API key is not available to the server runtime.');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: String(systemPrompt || '') }] },
        contents: [{ role: 'user', parts: [{ text: String(userPrompt || '') }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
          responseSchema: getStructuredResponseSchema(systemPrompt),
        },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    const detail = data?.error?.message || data?.error?.status || `${response.status} ${response.statusText}`;
    throw new Error(`Gemini ${model}: ${detail}`);
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('')
    .trim();

  if (!text) {
    const finish = data?.candidates?.[0]?.finishReason || 'unknown';
    throw new Error(`Gemini ${model} returned no text (finishReason: ${finish}).`);
  }

  console.log(`[RightsTrack AI] Gemini response received (${model})`);
  return text;
}

async function callGemini({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 2000 }) {
  const models = getGeminiModels();
  let lastError = null;

  for (const model of models) {
    try {
      return await callGeminiModel({ model, systemPrompt, userPrompt, temperature, maxTokens });
    } catch (error) {
      lastError = error;
      console.warn(`[RightsTrack AI] Gemini ${model} unavailable; trying next model:`, errorMessage(error));
    }
  }

  throw lastError || new Error('No Gemini model is available.');
}

async function callClaudeProvider({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 2000 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Claude API key is not available to the server runtime.');
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error?.message ? ` — ${body.error.message}` : '';
    } catch (_) {}
    throw new Error(`Claude API error: ${response.status} ${response.statusText}${detail}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

export async function callClaude({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 2000 }) {
  const providers = getProviderOrder();
  let lastError = null;

  for (const provider of providers) {
    try {
      const result = provider === 'gemini'
        ? await callGemini({ systemPrompt, userPrompt, temperature, maxTokens })
        : await callClaudeProvider({ systemPrompt, userPrompt, temperature, maxTokens });
      if (result) return result;
    } catch (error) {
      lastError = error;
      console.warn(`[RightsTrack AI] ${provider} unavailable:`, errorMessage(error));
    }
  }

  throw new Error(`Configured AI provider failed: ${errorMessage(lastError)}`);
}

export function getAIProviderStatus() {
  const provider = String(process.env.AI_PROVIDER || 'gemini').toLowerCase();
  return {
    configured_provider: provider,
    gemini_key_available: Boolean(getGeminiKey()),
    claude_key_available: Boolean(process.env.ANTHROPIC_API_KEY),
    gemini_models: getGeminiModels(),
  };
}
