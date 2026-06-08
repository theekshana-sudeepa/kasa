import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { buildSystemPrompt, getFestivalContext } from '@/app/lib/ai/system-prompt';
import { getMCPClient } from '@/app/lib/mcp/client';
import type { CartItem, Language } from '@/app/lib/mcp/types';
import { parseAssistantResponse } from '@/app/lib/ai/response-parser';
import { getConversation, setConversation } from '@/app/lib/ai/session-store';

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
// Returns an object with a text summary and optional structured products
async function executeMCPTools(message: string): Promise<{ text: string; products?: any[] }>
{
  const mcpClient = getMCPClient();
  const lower = message.toLowerCase();
  const results: string[] = [];
  let products: any[] | undefined = undefined;

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

      // If parsed is an array of product-like objects, extract common fields
      if (Array.isArray(parsed)) {
        products = parsed.map((p: any) => ({
          product_id: p.product_id?.toString?.() ?? p.id?.toString?.() ?? String(p.product_id ?? p.id ?? ''),
          name: p.name ?? p.title ?? '',
          price: Number(p.price ?? p.list_price ?? 0),
          currency: p.currency ?? 'LKR',
          image_url: p.image_url ?? p.image ?? p.img ?? '',
          in_stock: p.in_stock !== undefined ? Boolean(p.in_stock) : true,
        }));
      }
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

  return { text: results.join('\n\n'), products };
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
    const mcpResult = await executeMCPTools(message);

    // Retrieve conversation history early (needed if we inject immediate assistant messages)
    let history = getConversation(sessionId) ?? [];

    // If MCP returned structured products, inject an assistant message with <PRODUCTS>
    if (mcpResult.products && mcpResult.products.length > 0) {
      const prodMsg = `<PRODUCTS>${JSON.stringify(mcpResult.products)}</PRODUCTS>`;
      // Save as assistant message so frontend shows product carousel immediately
      history.push({ role: 'assistant' as const, content: prodMsg });
      setConversation(sessionId, history);
      // Persist parsed response for frontend
      const { setParsedResponse } = await import('@/app/lib/ai/session-store');
      setParsedResponse(sessionId, { text: '', products: mcpResult.products });
    }

    // Build user message with MCP context (include textual tool output)
    const userContent = mcpResult.text
      ? `${message}\n\n--- TOOL RESULTS (use this data in your response, format products using <PRODUCTS> tags) ---\n${mcpResult.text}`
      : message;

    history.push({ role: 'user' as const, content: userContent });

    if (history.length > MAX_HISTORY) {
      history = history.slice(-MAX_HISTORY);
    }

    // Stream response using Google Gemini (FREE!)
    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: history,
      temperature: 0.7,
      onFinish: async (event) => {
        if (event.text) {
          const assistantText = event.text;
          history.push({ role: 'assistant' as const, content: assistantText });
          setConversation(sessionId, history);

          // Parse structured tags and save parsed result for frontend use
          try {
            const parsed = parseAssistantResponse(assistantText);
            // Lazy import to avoid circular dependency at module level
            const { setParsedResponse } = await import('@/app/lib/ai/session-store');
            setParsedResponse(sessionId, parsed);

            // If the assistant did not emit products but printed a kapruka tool call,
            // try to extract the tool call and execute it directly against the MCP.
            if ((!parsed.products || parsed.products.length === 0) && /kapruka_search_products\s*\(/i.test(assistantText)) {
              try {
                const toolMatch = assistantText.match(/kapruka_search_products\s*\(([^)]*)\)/i);
                if (toolMatch) {
                  const argsRaw = toolMatch[1];
                  // Simple arg parser: key=value pairs separated by commas
                  const args: Record<string, any> = {};
                  for (const part of argsRaw.split(/\s*,\s*/)) {
                    const m = part.match(/([a-zA-Z0-9_]+)\s*=\s*(.+)/);
                    if (!m) continue;
                    const k = m[1];
                    let v = m[2].trim();
                    // Strip surrounding quotes
                    if ((v.startsWith("\'") && v.endsWith("\'")) || (v.startsWith('"') && v.endsWith('"'))) {
                      v = v.slice(1, -1);
                    } else if (/^\d+$/.test(v)) {
                      v = Number(v);
                    } else if (/^True$|^False$/i.test(v)) {
                      v = /^True$/i.test(v);
                    }
                    args[k] = v;
                  }

                  const mcpClient = getMCPClient();
                  const searchRes = await mcpClient.searchProducts({
                    query: (args.q as string) || (args.query as string) || '',
                    category: args.category as string | undefined,
                    in_stock_only: args.in_stock_only !== undefined ? Boolean(args.in_stock_only) : true,
                    limit: args.limit ? Number(args.limit) : 5,
                  });
                  const parsedTools = mcpClient.parseResult<unknown>(searchRes);
                  if (Array.isArray(parsedTools)) {
                    const products = parsedTools.map((p: any) => ({
                      product_id: p.product_id?.toString?.() ?? p.id?.toString?.() ?? String(p.product_id ?? p.id ?? ''),
                      name: p.name ?? p.title ?? '',
                      price: Number(p.price ?? p.list_price ?? 0),
                      currency: p.currency ?? 'LKR',
                      image_url: p.image_url ?? p.image ?? p.img ?? '',
                      in_stock: p.in_stock !== undefined ? Boolean(p.in_stock) : true,
                    }));

                    // Persist these products so the client can fetch and render them
                    setParsedResponse(sessionId, { text: '', products });
                    // Also append an assistant message with the PRODUCTS tag
                    const prodMsg = `<PRODUCTS>${JSON.stringify(products)}</PRODUCTS>`;
                    history.push({ role: 'assistant' as const, content: prodMsg });
                    setConversation(sessionId, history);
                  }
                }
              } catch (toolErr) {
                console.error('[KASA] Failed to execute parsed kapruka tool call:', toolErr);
              }
            }
          } catch (err) {
            console.error('[KASA] Failed to parse assistant response:', err);
          }
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
