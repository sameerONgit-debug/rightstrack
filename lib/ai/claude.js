/**
 * Claude AI Client Wrapper
 * Handles prompt orchestration for domain classification, entity extraction, and grounded legal drafting.
 */

export async function callClaude({ systemPrompt, userPrompt, temperature = 0.2, maxTokens = 2000 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[Claude AI] ANTHROPIC_API_KEY not configured. Falling back to deterministic responses.');
    return null;
  }

  // Keep the model configurable so the AI pipeline can be upgraded without
  // changing classifier/extractor logic. Sonnet 4.6 is the current stable
  // Sonnet API model used by this MVP.
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
      } catch (_) {
        // Keep the generic status error if the response is not JSON.
      }
      throw new Error(`Claude API error: ${response.status} ${response.statusText}${detail}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  } finally {
    clearTimeout(timeout);
  }
}
