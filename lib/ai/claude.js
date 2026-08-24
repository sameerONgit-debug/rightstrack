/**
 * RightsTrack AI provider.
 * Gemini is the primary semantic provider. Claude is optional.
 * The historical callClaude name is retained for compatibility.
 */

function getGeminiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

function getProviderOrder() {
  const configured = String(process.env.AI_PROVIDER || 'gemini').toLowerCase();
  if (configured === 'claude') return ['claude'];
  return ['gemini', 'claude'];
}

function errorMessage(error) {
  if (!error) return 'unknown error';
  if (typeof error === 'string') return error;
  return error.message || error.statusText || error.status || JSON.stringify(error);
}

async function callGemini({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 2000 }) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('Gemini API key is not available to the server runtime.');

  const models = [
    process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    'gemini-2.0-flash',
  ].filter((model, index, list) => model && list.indexOf(model) === index);

  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: String(systemPrompt || '') }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: String(userPrompt || '') }],
              },
            ],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: 'application/json',
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
    } catch (error) {
      lastError = error;
      console.error(`[RightsTrack AI] Gemini ${model} failed:`, errorMessage(error));
    }
  }

  throw lastError || new Error('Gemini request failed.');
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
  let lastError = null;

  for (const provider of getProviderOrder()) {
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

  throw new Error(`All configured AI providers failed: ${errorMessage(lastError)}`);
}

export function getAIProviderStatus() {
  const provider = String(process.env.AI_PROVIDER || 'gemini').toLowerCase();
  return {
    configured_provider: provider,
    gemini_key_available: Boolean(getGeminiKey()),
    claude_key_available: Boolean(process.env.ANTHROPIC_API_KEY),
    gemini_model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  };
}
