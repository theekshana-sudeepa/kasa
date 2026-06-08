import { getMCPClient } from '@/app/lib/mcp/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { city, date, product_id } = body;

    if (!city || !date || !product_id) {
      return new Response(JSON.stringify({ error: 'city, date, and product_id are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const client = getMCPClient();
    const res = await client.checkDelivery(city, date, product_id);
    const parsed = client.parseResult<Record<string, unknown>>(res);

    return new Response(JSON.stringify({ result: parsed }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[Delivery Check] error', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'internal' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
