/**
 * KASA v4.0 — Smart Suggestions API
 * 
 * Returns context-aware suggestions based on conversation state.
 */

import { z } from 'zod';
import { generateSmartSuggestions, detectResponseType } from '@/app/lib/ai/suggestion-engine';
import { getMemory, getMessageCount } from '@/app/lib/ai/session-store';

const SuggestionsRequestSchema = z.object({
  sessionId: z.string().min(1),
  lastResponseText: z.string().optional().default(''),
  hasProducts: z.boolean().optional().default(false),
  cart: z
    .array(
      z.object({
        product_id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
        image_url: z.string(),
      })
    )
    .optional()
    .default([]),
  lastProductNames: z.array(z.string()).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const rawBody: unknown = await request.json();
    const parsedBody = SuggestionsRequestSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return new Response(JSON.stringify({ error: 'sessionId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { sessionId, lastResponseText, hasProducts, cart, lastProductNames } = parsedBody.data;

    const memory = getMemory(sessionId);
    const messageCount = getMessageCount(sessionId);
    const responseType = detectResponseType(lastResponseText, hasProducts);

    const suggestions = generateSmartSuggestions({
      responseType,
      cart,
      memory,
      lastProductNames,
      messageCount,
    });

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Suggestions API] Error:', err);
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
