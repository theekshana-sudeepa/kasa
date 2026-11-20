import { z } from 'zod';

const CartSyncSchema = z.object({
  cart: z.array(
    z.object({
      product_id: z.string(),
      name: z.string(),
      price: z.number().nonnegative(),
      quantity: z.number().int().positive(),
      image_url: z.string().optional().default(''),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const rawBody: unknown = await request.json();
    const parsed = CartSyncSchema.safeParse(rawBody);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'cart must be a valid array of cart items' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { cart } = parsed.data;
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return new Response(JSON.stringify({ cart, total }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Cart Sync] error', err);
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
