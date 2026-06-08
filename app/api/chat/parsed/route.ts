import { getParsedResponse } from '@/app/lib/ai/session-store';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const parsed = getParsedResponse(sessionId);

    return new Response(JSON.stringify({ parsed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[KASA Parsed] Error:', err);
    return new Response(JSON.stringify({ error: 'internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
