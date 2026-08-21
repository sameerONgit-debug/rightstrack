/**
 * Voyage AI Embeddings Client Wrapper
 */
export async function getVoyageEmbedding(text) {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    console.warn('[Voyage AI] VOYAGE_API_KEY not configured.');
    return null;
  }

  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: [text],
      model: 'voyage-law-2',
    }),
  });

  if (!response.ok) {
    throw new Error(`Voyage API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data?.[0]?.embedding || null;
}
