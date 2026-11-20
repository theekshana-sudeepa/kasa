import { z } from 'zod';
import { getMCPClient } from '@/app/lib/mcp/client';

const DeliveryCheckSchema = z.object({
  city: z.string().min(1),
  date: z.string().min(1),
  product_id: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const rawBody: unknown = await request.json();
    const parsedBody = DeliveryCheckSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return new Response(JSON.stringify({ error: 'city, date, and product_id are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { city, date, product_id } = parsedBody.data;
    const client = getMCPClient();
    const res = await client.checkDelivery(city, date, product_id);
    const parsed = client.parseResult<Record<string, unknown>>(res);

    return new Response(JSON.stringify({ result: parsed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Delivery Check] error', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
