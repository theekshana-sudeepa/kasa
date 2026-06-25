/**
 * KASA v4.0 — Smart Suggestions API
 * 
 * Returns context-aware suggestions based on conversation state.
 */

import { generateSmartSuggestions, detectResponseType } from '@/app/lib/ai/suggestion-engine';
import { getMemory, getMessageCount } from '@/app/lib/ai/session-store';
import type { CartItem } from '@/app/lib/mcp/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, lastResponseText = '', hasProducts = false, cart = [], lastProductNames = [] } = body as {
      sessionId: string;
      lastResponseText: string;
      hasProducts: boolean;
      cart: CartItem[];
      lastProductNames: string[];
    };

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
