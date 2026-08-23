/**
 * RightsTrack AI provider.
 * Gemini is the primary provider. Claude is optional fallback.
 * The historical callClaude name is retained so existing pipeline callers do not change.
 */

function getProviderOrder() {
  return String(process.env.AI_PROVIDER || 'gemini').toLowerCase() === 'claude'
    ? ['claude']
    : ['gemini', 'claude'];
}

async function callGemini({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 2000 }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const models = [
    process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    'gemini-2.0-flash',
  ].filter((model, index, list) => model && list.indexOf(model) === index);

  let lastError = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: String(userPrompt || '') }] }],
        config: {
          systemInstruction: String(systemPrompt || ''),
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
        },
      });

      const text = String(response?.text || '').trim();
      if (!text) throw new Error(`Gemini ${model} returned an empty response.`);
      console.log(`[RightsTrack AI] Gemini response received (${model})`);
      return text;
    } catch (error) {
      lastError = error;
      console.error(`[RightsTrack AI] Gemini ${model} failed:`, error?.message || error);
    }
  }

  throw lastError || new Error('Gemini request failed.');
}

async function callClaudeProvider({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 2000 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
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

  if (!response.ok) throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
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
  console.warn('[RightsTrack AI] All configured providers failed:', lastError?.message || 'unknown error');
  return null;
}
