/**
 * RightsTrack AI provider.
 *
 * Gemini is the primary provider so the MVP can run without an Anthropic
 * subscription. Claude remains available as an optional fallback when its key
 * is configured. The rest of the AI pipeline keeps using the same callClaude
 * interface, so no UI or pipeline callers need to change.
 */

function getProviderOrder() {
  const configured = String(process.env.AI_PROVIDER || '').toLowerCase();
  if (configured === 'claude') return ['claude'];
  if (configured === 'gemini') return ['gemini', 'claude'];
  return ['gemini', 'claude'];
}

async function callGemini({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 2000 }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
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
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}${detail}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  } finally {
    clearTimeout(timeout);
  }
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

      if (result) {
        console.log(`[RightsTrack AI] ${provider} response received`);
        return result;
      }
    } catch (error) {
      lastError = error;
      console.warn(`[RightsTrack AI] ${provider} unavailable:`, error.message);
    }
  }

  if (lastError) console.warn('[RightsTrack AI] All configured providers failed:', lastError.message);
  else console.warn('[RightsTrack AI] No AI API key configured. Using deterministic fallback.');
  return null;
}
