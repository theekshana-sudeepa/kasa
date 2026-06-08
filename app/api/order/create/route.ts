import { getMCPClient } from '@/app/lib/mcp/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation
    const required = ['items', 'delivery_city', 'delivery_date', 'recipient_name', 'recipient_phone', 'recipient_address', 'sender_name', 'sender_email'];
    for (const k of required) {
      if (!body[k]) {
        return new Response(JSON.stringify({ error: `${k} is required` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    const client = getMCPClient();
    const res = await client.createOrder(body);
    const parsed = client.parseResult<Record<string, unknown>>(res);

    return new Response(JSON.stringify({ result: parsed }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[Create Order] error', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'internal' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
