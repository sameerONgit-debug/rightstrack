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

async function callGemini({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 2000 }) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('Gemini API key is not available to the server runtime.');

  // Use Google's stable Generative AI SDK. This avoids provider-specific REST
  // request-shape differences while keeping the existing call interface intact.
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const client = new GoogleGenerativeAI(apiKey);
  const models = [
    process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    'gemini-2.0-flash',
  ].filter((model, index, list) => model && list.indexOf(model) === index);

  let lastError = null;
  for (const modelName of models) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: String(systemPrompt || ''),
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(String(userPrompt || ''));
      const text = result?.response?.text?.();
      if (!text || !text.trim()) throw new Error(`Gemini ${modelName} returned an empty response.`);

      console.log(`[RightsTrack AI] Gemini response received (${modelName})`);
      return text.trim();
    } catch (error) {
      lastError = error;
      console.error(`[RightsTrack AI] Gemini ${modelName} failed:`, error?.message || error);
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
      console.warn(`[RightsTrack AI] ${provider} unavailable:`, error?.message || error);
    }
  }

  // IMPORTANT: never silently turn a provider failure into a fake semantic
  // classification. The caller can choose its deterministic safety fallback,
  // but the failure is now explicit and diagnosable.
  console.error('[RightsTrack AI] All configured providers failed:', lastError?.message || 'unknown error');
  return null;
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
