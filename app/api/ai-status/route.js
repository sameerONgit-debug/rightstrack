import { NextResponse } from 'next/server';
import { getAIProviderStatus } from '../../../lib/ai/claude';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = getAIProviderStatus();

  return NextResponse.json({
    ok: status.gemini_key_available || status.claude_key_available,
    ...status,
    message: status.gemini_key_available
      ? 'Gemini is configured for the server runtime.'
      : 'No Gemini key is available to the server runtime.',
  });
}
