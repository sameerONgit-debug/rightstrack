/**
 * RightsTrack AI provider.
 * Gemini is the primary provider. Claude is optional fallback.
 *
 * The public interface remains callClaude() for compatibility with the
 * existing AI pipeline; despite the historical name, Gemini is now the
 * default provider.
 */

function getProviderOrder() {
  const configured = String(process.env.AI_PROVIDER || 'gemini').toLowerCase();
  if (configured === 'claude') return ['claude'];
  return ['gemini', 'claude'];
}

async function callGemini({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 2000 }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');

  // Keep a small model fallback so a newly created/free AI Studio key does not
  // silently drop into the deterministic classifier because one model alias is
  // unavailable for that account/project.
  const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const models = [configuredModel, 'gemini-2.0-flash'].filter((model, index, list) => list.indexOf(model) === index);
  let lastError = null;

  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: String(systemPrompt || '') }] },
            contents: [{ role: 'user', parts: [{ text: String(userPrompt || '') }] }],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        let detail = '';
        try {
          const errorBody = await response.json();
          detail = errorBody?.error?.message ? ` — ${errorBody.error.message}` : '';
        } catch (_) {}
        throw new Error(`Gemini ${model}: ${response.status} ${response.statusText}${detail}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
      if (!text) throw new Error(`Gemini ${model} returned no text.`);
      console.log(`[RightsTrack AI] Gemini response received (${model})`);
      return text;
    } catch (error) {
      lastError = error;
      console.warn('[RightsTrack AI] Gemini attempt failed:', error.message);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('Gemini request failed.');
}

async function callClaudeProvider({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 2000 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
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
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = '';
      try {
        const errorBody = await response.json();
        detail = errorBody?.error?.message ? ` — ${errorBody.error.message}` : '';
      } catch (_) {}
      throw new Error(`Claude API error: ${response.status} ${response.statusText}${detail}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  } finally {
    clearTimeout(timeout);
  }
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
      console.warn(`[RightsTrack AI] ${provider} unavailable:`, error.message);
    }
  }

  // Returning null preserves the existing deterministic safety fallback, but
  // the server log now contains the real Gemini error instead of hiding it.
  if (lastError) console.warn('[RightsTrack AI] All configured providers failed:', lastError.message);
  return null;
}
