import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { buildSystemPrompt, getFestivalContext } from '@/app/lib/ai/system-prompt';
import { getMCPClient } from '@/app/lib/mcp/client';
import type { CartItem, Language } from '@/app/lib/mcp/types';

// In-memory conversation store
type Message = { role: 'user' | 'assistant' | 'system'; content: string };
const conversations = new Map<string, Message[]>();
const MAX_HISTORY = 30;

interface ChatRequestBody {
  message: string;
  sessionId: string;
  language: Language;
  cart: CartItem[];
  giftMode: boolean;
  deliveryCity?: string;
  deliveryDate?: string;
}

// Detect intent and call MCP tools before LLM response
async function executeMCPTools(message: string): Promise<string> {
  const mcpClient = getMCPClient();
  const lower = message.toLowerCase();
  const results: string[] = [];

  try {
    // Product search intent
    if (
      lower.includes('show me') ||
      lower.includes('find') ||
      lower.includes('search') ||
      lower.includes('looking for') ||
      lower.includes('want') ||
      lower.includes('need') ||
      lower.includes('gift') ||
      lower.includes('buy') ||
      lower.includes('cake') ||
      lower.includes('flower') ||
      lower.includes('chocolate') ||
      lower.includes('electronic') ||
      lower.includes('grocer') ||
      lower.includes('festival') ||
      lower.includes('birthday') ||
      lower.includes('anniversary') ||
      lower.includes('wedding') ||
      lower.includes('toy') ||
      lower.includes('gadget') ||
      lower.includes('phone') ||
      lower.includes('wine') ||
      lower.includes('hamper') ||
      lower.includes('fruit') ||
      lower.includes('baby') ||
      lower.includes('jewelry') ||
      lower.includes('perfume')
    ) {
      // Extract search query
      let query = message
        .replace(/^(show me|find me|search for|i want|i need|looking for|can you find|get me|i'm looking for|i am looking for)\s*/i, '')
        .replace(/\s*(please|thanks|thank you|pls)$/i, '')
        .trim();
      if (query.length < 2) query = message;

      const searchResult = await mcpClient.searchProducts({
        query,
        in_stock_only: true,
        limit: 5,
      });
      const parsed = mcpClient.parseResult<unknown>(searchResult);
      results.push(`[SEARCH RESULTS for "${query}"]:\n${JSON.stringify(parsed, null, 2)}`);
    }

    // Product details intent
    const productIdMatch = message.match(/(?:product|item|details?|more about)\s*(?:id\s*)?[:#]?\s*(\d+)/i);
    if (productIdMatch) {
      const detailResult = await mcpClient.getProduct(productIdMatch[1]);
      const parsed = mcpClient.parseResult<unknown>(detailResult);
      results.push(`[PRODUCT DETAILS]:\n${JSON.stringify(parsed, null, 2)}`);
    }

    // Category browsing
    if (lower.includes('categories') || lower.includes('browse') || lower.includes('what do you have') || lower.includes('what can i buy')) {
      const catResult = await mcpClient.listCategories();
      const parsed = mcpClient.parseResult<unknown>(catResult);
      results.push(`[CATEGORIES]:\n${JSON.stringify(parsed, null, 2)}`);
    }

    // Delivery city search
    const cityMatch = message.match(/(?:deliver(?:y|ing)?\s+(?:to|in|at)|city)\s+(\w[\w\s]*)/i);
    if (cityMatch) {
      const cityResult = await mcpClient.listDeliveryCities(cityMatch[1].trim());
      const parsed = mcpClient.parseResult<unknown>(cityResult);
      results.push(`[DELIVERY CITIES]:\n${JSON.stringify(parsed, null, 2)}`);
    }

    // Order tracking
    const trackMatch = message.match(/(?:track|status|where is)\s+(?:order\s*)?(?:#?\s*)?(KAP-?\d+|\d{5,})/i);
    if (trackMatch) {
      const trackResult = await mcpClient.trackOrder(trackMatch[1]);
      const parsed = mcpClient.parseResult<unknown>(trackResult);
      results.push(`[ORDER TRACKING]:\n${JSON.stringify(parsed, null, 2)}`);
    }

  } catch (err) {
    console.error('[KASA MCP] Tool execution error:', err);
    results.push(`[MCP ERROR]: ${err instanceof Error ? err.message : 'Tool call failed'}`);
  }

  return results.join('\n\n');
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const {
      message,
      sessionId,
      language = 'en',
      cart = [],
      giftMode = false,
      deliveryCity,
    } = body;

    if (!message || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'message and sessionId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt
    const festivalContext = getFestivalContext();
    const systemPrompt = buildSystemPrompt(
      language,
      giftMode,
      cart,
      deliveryCity ?? null,
      festivalContext
    );

    // Execute MCP tools based on user intent
    const mcpData = await executeMCPTools(message);

    // Retrieve conversation history
    let history = conversations.get(sessionId) ?? [];

    // Build user message with MCP context
    const userContent = mcpData
      ? `${message}\n\n--- TOOL RESULTS (use this data in your response, format products using <PRODUCTS> tags) ---\n${mcpData}`
      : message;

    history.push({ role: 'user' as const, content: userContent });

    if (history.length > MAX_HISTORY) {
      history = history.slice(-MAX_HISTORY);
    }

    // Stream response using Google Gemini (FREE!)
    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: systemPrompt,
      messages: history,
      temperature: 0.7,
      onFinish: async (event) => {
        if (event.text) {
          history.push({ role: 'assistant' as const, content: event.text });
          conversations.set(sessionId, history);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[KASA Chat] Request error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
