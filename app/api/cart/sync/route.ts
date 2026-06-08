export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cart } = body;

    if (!Array.isArray(cart)) {
      return new Response(JSON.stringify({ error: 'cart must be an array' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // For now, echo back and compute total
    const total = cart.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);

    return new Response(JSON.stringify({ cart, total }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[Cart Sync] error', err);
    return new Response(JSON.stringify({ error: 'internal' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
