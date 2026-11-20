import { z } from 'zod';
import { getMCPClient } from '@/app/lib/mcp/client';

const CreateOrderSchema = z.object({
  items: z.array(
    z.object({
      product_id: z.string().min(1),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  delivery_city: z.string().min(1),
  delivery_date: z.string().min(1),
  recipient_name: z.string().min(1),
  recipient_phone: z.string().min(1),
  recipient_address: z.string().min(1),
  sender_name: z.string().min(1),
  sender_email: z.string().email(),
  gift_message: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const rawBody: unknown = await request.json();
    const parsedBody = CreateOrderSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      const field = firstIssue?.path.join('.') || 'payload';
      return new Response(JSON.stringify({ error: `${field}: ${firstIssue?.message ?? 'invalid value'}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = getMCPClient();
    const res = await client.createOrder(parsedBody.data);
    const parsed = client.parseResult<Record<string, unknown>>(res);

    return new Response(JSON.stringify({ result: parsed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Create Order] error', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
