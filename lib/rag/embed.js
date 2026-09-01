async function embedText(text) {
  if (!process.env.VOYAGE_API_KEY) throw new Error('VOYAGE_API_KEY is not configured.');
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.VOYAGE_API_KEY}` },
    body: JSON.stringify({ input: [String(text)], model: process.env.VOYAGE_MODEL || 'voyage-law-2' }),
  });
  if (!response.ok) throw new Error(`Voyage embedding failed: ${response.status}`);
  const data = await response.json();
  return data.data?.[0]?.embedding || [];
}

async function embedBatch(texts) {
  if (!process.env.VOYAGE_API_KEY) throw new Error('VOYAGE_API_KEY is not configured.');
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.VOYAGE_API_KEY}` },
    body: JSON.stringify({ input: texts.map(String), model: process.env.VOYAGE_MODEL || 'voyage-law-2' }),
  });
  if (!response.ok) throw new Error(`Voyage embedding failed: ${response.status}`);
  const data = await response.json();
  return data.data || [];
}
module.exports = { embedText, embedBatch };
