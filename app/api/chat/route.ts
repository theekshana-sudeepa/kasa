import { streamText } from 'ai';
import { checkRateLimit, rateLimitResponse, sanitizeInput } from '@/app/lib/security/rate-limiter';
import { buildSystemPrompt, getFestivalContext } from '@/app/lib/ai/system-prompt';
import { getMCPClient } from '@/app/lib/mcp/client';
import { extractIntent, extractIntentFallback, emotionToMood } from '@/app/lib/ai/intent-extractor';
import type { ExtractedIntent } from '@/app/lib/ai/intent-extractor';
import type { CartItem, Language, Product, Mood } from '@/app/lib/mcp/types';
import {
  getConversation,
  addMessage,
  setConversation,
  getMemory,
  setMemory,
  setLastMood,
  getMessageCount,
  recordMCPRequest,
} from '@/app/lib/ai/session-store';
import { extractMemoryFromMessage, mergeMemory, formatMemoryForPrompt } from '@/app/lib/ai/memory-engine';
import { generateSmartSuggestions, detectResponseType } from '@/app/lib/ai/suggestion-engine';
import { rankProducts } from '@/app/lib/ai/product-ranker';
import {
  predictLikelyAdditions,
  addToGhostCart,
  createGhostCartItem,
} from '@/app/lib/ai/ghost-cart';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };
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

// ── AI Model Provider ───────────────────────────────────────────
function getModel() {
  try {
    if (process.env.GROQ_API_KEY) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createGroq } = require('@ai-sdk/groq');
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
      return { model: groq('llama-3.3-70b-versatile'), provider: 'Groq' };
    }
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createGoogleGenerativeAI } = require('@ai-sdk/google');
      const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
      return { model: google('gemini-2.0-flash'), provider: 'Gemini' };
    }
    if (process.env.OPENAI_API_KEY) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createOpenAI } = require('@ai-sdk/openai');
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return { model: openai('gpt-4o-mini'), provider: 'OpenAI' };
    }
  } catch (err: unknown) {
    if (process.env.NODE_ENV === 'development') console.error('[KASA] Failed to load AI provider:', err);
  }
  return null;
}

// ── MCP Product Parser ──────────────────────────────────────────
async function parseProductsFromMarkdown(markdown: string): Promise<string> {
  const mcpClient = getMCPClient();
  const products: Array<{
    product_id: string;
    name: string;
    price: number;
    currency: string;
    image_url: string;
    url: string;
    in_stock: boolean;
  }> = [];

  // Strategy 1: Try JSON array first (some MCP responses are structured JSON)
  try {
    const jsonMatch = markdown.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (jsonMatch) {
      const arr = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>;
      if (Array.isArray(arr) && arr.length > 0 && arr[0].product_id) {
        for (const item of arr.slice(0, 5)) {
          products.push({
            product_id: String(item.product_id || item.id || ''),
            name: String(item.name || item.title || ''),
            price: Number(item.price || 0),
            currency: 'LKR',
            image_url: String(item.image_url || item.image || ''),
            url: String(item.url || item.link || `https://www.kapruka.com/buyonline/${item.product_id || item.id}`),
            in_stock: Boolean(item.in_stock ?? item.available ?? true),
          });
        }
      }
    }
  } catch { /* not JSON */ }

  // Strategy 2: Standard markdown format **N. name** \n ID: `id` · LKR price
  if (products.length === 0) {
    const productRegex = /\*\*\d+\.\s+(.+?)\*\*\s*\n\s*ID:\s*`([^`]+)`\s*[·•]\s*LKR\s*([\d,]+)/g;
    let match;
    while ((match = productRegex.exec(markdown)) !== null) {
      const name = match[1].trim();
      const productId = match[2].trim();
      const price = parseInt(match[3].replace(/,/g, ''), 10);
      const urlMatch = markdown.slice(match.index).match(/\[View product\]\((https?:\/\/[^)]+)\)/);
      const url = urlMatch ? urlMatch[1] : `https://www.kapruka.com/buyonline/${productId}`;
      products.push({ product_id: productId, name, price, currency: 'LKR', image_url: '', url, in_stock: true });
    }
  }

  // Strategy 3: Looser pattern — any bolded product name followed by LKR price nearby
  if (products.length === 0) {
    const looseRegex = /\*\*(.+?)\*\*[\s\S]{0,200}?(?:ID|id):\s*[`]?([A-Za-z0-9_-]+)[`]?[\s\S]{0,100}?LKR\s*([\d,]+)/g;
    let match;
    while ((match = looseRegex.exec(markdown)) !== null && products.length < 5) {
      const name = match[1].replace(/^\d+\.\s*/, '').trim();
      if (name.length < 3) continue;
      const productId = match[2].trim();
      const price = parseInt(match[3].replace(/,/g, ''), 10);
      if (!productId || !price) continue;
      products.push({
        product_id: productId, name, price, currency: 'LKR', image_url: '',
        url: `https://www.kapruka.com/buyonline/${productId}`, in_stock: true,
      });
    }
  }

  // Strategy 4: Extract product IDs from links and names from headings
  if (products.length === 0) {
    const linkRegex = /\[([^\]]+)\]\(https?:\/\/(?:www\.)?kapruka\.com\/(?:buyonline\/|p\/)([A-Za-z0-9_-]+)[^)]*\)/g;
    let match;
    const pricePattern = /LKR\s*([\d,]+)/;
    while ((match = linkRegex.exec(markdown)) !== null && products.length < 5) {
      const name = match[1].trim();
      const productId = match[2].trim();
      const surrounding = markdown.slice(Math.max(0, match.index - 100), match.index + 200);
      const priceMatch = surrounding.match(pricePattern);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;
      if (name.length > 2 && productId) {
        products.push({
          product_id: productId, name, price, currency: 'LKR', image_url: '',
          url: `https://www.kapruka.com/buyonline/${productId}`, in_stock: true,
        });
      }
    }
  }

  if (products.length > 0) {
    const startTime = Date.now();
    await Promise.race([
      Promise.all(products.map(async (p) => {
        try {
          const detail = await mcpClient.getProduct(p.product_id);
          const raw = mcpClient.parseResult<unknown>(detail);
          
          let data: Record<string, unknown> | null = null;
          if (typeof raw === 'object' && raw !== null) {
            data = raw as Record<string, unknown>;
          } else if (typeof raw === 'string') {
            try { data = JSON.parse(raw); } catch { /* not JSON */ }
          }

          if (data) {
            const images = data.images as string[] | undefined;
            if (images && Array.isArray(images) && images.length > 0) {
              p.image_url = images[0];
            } else if (typeof data.image_url === 'string') {
              p.image_url = data.image_url;
            }
            // Update price from detail if available
            if (typeof data.price === 'number' && data.price > 0 && p.price === 0) {
              p.price = data.price;
            }
          }
        } catch { /* skip */ }
      })),
      new Promise(resolve => setTimeout(resolve, 6000)),
    ]);
    recordMCPRequest(Date.now() - startTime, true);

    return `<PRODUCTS>${JSON.stringify(products)}</PRODUCTS>`;
  }
  return '';
}

// ── MCP Tool Execution Pipeline ─────────────────────────────────
async function executeMCPToolsWithIntent(
  message: string,
  intent: ExtractedIntent
): Promise<string> {
  const mcpClient = getMCPClient();
  const lower = message.toLowerCase();
  const results: string[] = [];
  let preFormattedProducts = '';

  try {
    if (intent.is_shopping && intent.search_queries.length > 0) {
      let allSearchText = '';
      
      for (const query of intent.search_queries.slice(0, 2)) {
        try {
          const startTime = Date.now();
          const searchResult = await mcpClient.searchProducts({
            query,
            in_stock_only: true,
            limit: 5,
            ...(intent.budget ? { max_price: intent.budget.max } : {}),
          });
          recordMCPRequest(Date.now() - startTime, true);
          const parsed = mcpClient.parseResult<string>(searchResult);
          
          if (parsed && !parsed.includes('No products found')) {
            results.push(`[SEARCH RESULTS for "${query}" (intent: ${intent.shopping_intent})]:\n${parsed}`);
            allSearchText += parsed + '\n';
          }
        } catch (searchErr: unknown) {
          if (process.env.NODE_ENV === 'development') console.warn(`[KASA MCP] Search failed for "${query}":`, searchErr);
        }
      }

      if (results.length === 0) {
        let fallbackQuery = message
          .replace(/^(show me|find me|search for|i want|i need|looking for|can you find|get me|i'm looking for|i am looking for)\s*/i, '')
          .replace(/\s*(please|thanks|thank you|pls)$/i, '')
          .trim();
        if (fallbackQuery.length < 2) fallbackQuery = message;

        const searchResult = await mcpClient.searchProducts({ query: fallbackQuery, in_stock_only: true, limit: 5 });
        const parsed = mcpClient.parseResult<string>(searchResult);
        results.push(`[SEARCH RESULTS for "${fallbackQuery}"]:\n${parsed}`);
        allSearchText = parsed;
      }

      if (allSearchText) {
        preFormattedProducts = await parseProductsFromMarkdown(allSearchText);
      }
    } else if (intent.intent_category === 'BROWSE' || lower.includes('categor') || lower.includes('browse') || lower.includes('what do you have')) {
      const catResult = await mcpClient.listCategories();
      const parsed = mcpClient.parseResult<string>(catResult);
      results.push(`[CATEGORIES]:\n${parsed}`);
    }

    const trackMatch = message.match(/(?:track|status|where is)\s+(?:order\s*)?(?:#?\s*)([\w\d]{5,})/i);
    if (trackMatch) {
      const trackResult = await mcpClient.trackOrder(trackMatch[1]);
      const parsed = mcpClient.parseResult<string>(trackResult);
      results.push(`[ORDER TRACKING]:\n${parsed}`);
    }
  } catch (err: unknown) {
    if (process.env.NODE_ENV === 'development') console.error('[KASA MCP] Tool error:', err);
  }

  let combined = results.join('\n\n');
  if (preFormattedProducts) {
    combined += `\n\n[PRE-FORMATTED PRODUCTS WITH REAL IMAGES — USE THIS EXACT JSON IN YOUR <PRODUCTS> TAG, DO NOT MODIFY OR INVENT IMAGE URLS]:\n${preFormattedProducts}`;
  }
  return combined;
}

// ── Smart Fallback (No AI Key) ──────────────────────────────────
async function generateFallbackResponse(
  sessionId: string,
  message: string,
  cart: CartItem[] = []
): Promise<{ text: string; mood: Mood }> {
  const mcpClient = getMCPClient();
  const lower = message.toLowerCase();
  let response = '';
  let productsTag = '';
  let urgencyPrefix = '';
  let mood: Mood = 'neutral';
  
  // Update memory from this message
  const memory = getMemory(sessionId);
  const memUpdates = extractMemoryFromMessage(message, memory, cart);
  const updatedMemory = mergeMemory(memory, memUpdates);
  setMemory(sessionId, updatedMemory);
  
  if (lower.match(/\b(urgent|asap|today|emergency|fast|quick)\b/i)) {
    urgencyPrefix = `**Urgency Detected:** I see you need this fast! I'll prioritize same-day delivery options available in Colombo & Suburbs.\n\n`;
    mood = 'urgent';
  }

  try {
    // CHECKOUT INTENT
    if (lower.match(/checkout|place order|buy now/i)) {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const itemLines = cart.map((item) => `• ${item.name} x${item.quantity} — Rs. ${item.price * item.quantity}`);

      if (itemLines.length > 0) {
        response = `Great choice! Let's complete your order.\n\n**Your Cart:**\n${itemLines.join('\n')}\n**Total: Rs. ${total}**\n\nTo proceed, I need a few details:\n\n**Which city** should I deliver to?\n**What date** do you need delivery? (YYYY-MM-DD)\n\nJust type the city name to get started!`;
        response += `\n\n<QUICK_REPLIES>["Colombo", "Kandy", "Galle", "Negombo", "Deliver tomorrow"]</QUICK_REPLIES>`;
      } else {
        response = `I'd love to help you checkout!\n\nTo place your order, I'll need:\n1. Delivery city\n2. Delivery date\n3. Recipient name & phone\n4. Delivery address\n\nWhich **city** should I deliver to?`;
        response += `\n\n<QUICK_REPLIES>["Colombo", "Kandy", "Galle", "Negombo"]</QUICK_REPLIES>`;
      }
    }
    // DELIVERY DATE RESPONSE
    else if (cart.length > 0 && lower.match(/(tomorrow|today|weekend|asap|as soon as possible|202\d-\d\d-\d\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|mon|tue|wed|thu|fri|sat|sun|next (week|month))/i) && message.split(' ').length <= 6) {
      const date = message.trim();
      let deliveryMsg = `Date confirmed: **${date}**`;
      
      const cityToCheck = updatedMemory.deliveryCity || 'Colombo';
      try {
        const checkResult = await mcpClient.checkDelivery(cityToCheck, date, cart[0].product_id);
        const checkText = mcpClient.parseResult<string>(checkResult);
        if (checkText.includes('Fee:')) {
          deliveryMsg += `\n\n${checkText}`;
        }
      } catch {
        /* delivery check failed — proceed without delivery info */
      }

      response = `${deliveryMsg}\n\nAlmost done! I just need the recipient's details to deliver the items. Please fill out the secure form below:`;
      response += `\n\n<CHECKOUT_FORM/>`;
    }
    // RE-ENTER DETAILS
    else if (lower.match(/re-enter details|reenter|change details|wrong details|no, let me/i)) {
      response = `No problem! Let's try that again.\n\nPlease fill out the delivery details below:`;
      response += `\n\n<CHECKOUT_FORM/>`;
    }
    // RECIPIENT DETAILS RESPONSE
    else if (cart.length > 0 && (lower.match(/deliver to/i) || (message.includes(',') && /[0-9]{9,}/.test(message.replace(/\s|-/g, ''))))) {
      let detailsStr = message.replace(/deliver to/i, '').trim();
      let senderName = 'Unknown';
      let senderEmail = 'Unknown';
      
      if (detailsStr.includes('| Sender:')) {
        const [recip, sender] = detailsStr.split('| Sender:');
        detailsStr = recip.trim();
        const sParts = sender.split(',').map(s => s.trim());
        senderName = sParts[0] || 'Unknown';
        senderEmail = sParts[1] || 'Unknown';
      }

      detailsStr = detailsStr.replace(/name:|phone:|address:|to:/gi, '');
      const parts = detailsStr.split(',').map(s => s.trim());
      
      let name = 'Unknown';
      let phone = 'Unknown';
      let address = 'Unknown';

      const phoneIndex = parts.findIndex(p => /[0-9]{9,}/.test(p.replace(/\s|-/g, '')));
      
      if (phoneIndex !== -1) {
        phone = parts[phoneIndex];
        name = phoneIndex > 0 ? parts[phoneIndex - 1] : parts[0];
        address = parts.slice(phoneIndex + 1).join(', ') || parts.filter((_, i) => i !== phoneIndex && i !== (phoneIndex > 0 ? phoneIndex - 1 : 0)).join(', ');
      } else {
        name = parts[0] || 'Unknown';
        phone = parts[1] || 'Unknown';
        address = parts.slice(2).join(', ') || 'Unknown';
      }

      response = `Great, I've noted the delivery details:\n\n**Name:** ${name}\n**Phone:** ${phone}\n**Address:** ${address}\n\nIs this correct? If yes, how would you like to pay?`;
      response += `\n\n<QUICK_REPLIES>["Credit/Debit Card", "Cash on Delivery", "Bank Transfer", "No, let me re-enter details"]</QUICK_REPLIES>`;
    }
    // PAYMENT METHOD RESPONSE
    else if (lower.match(/credit.*card|debit|cash on delivery|bank transfer|cod/i)) {
      response = `Payment method selected: **${message.trim()}**\n\nI have everything I need to place your order. Please confirm to proceed.`;
      response += `\n\n<QUICK_REPLIES>["Confirm Order", "Cancel"]</QUICK_REPLIES>`;
    }
    // CONFIRM ORDER RESPONSE
    else if (lower.match(/confirm order|pay now/i)) {
      const mem = updatedMemory;
      const items = cart.map(c => `${c.product_id}:${c.quantity}`).join(',');
      
      try {
        const orderRes = await mcpClient.callTool('kapruka_create_order', {
          items,
          delivery_city: mem.deliveryCity || 'Colombo',
          delivery_date: mem.deliveryDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
          recipient_name: mem.recipientInfo?.name || 'Test User',
          recipient_phone: mem.recipientInfo?.phone || '0771234567',
          recipient_address: mem.recipientInfo?.address || '123 Test St',
          sender_name: mem.senderInfo?.name || 'Test Sender',
          sender_email: mem.senderInfo?.email || 'test@test.com'
        });
        
        const rawRes = mcpClient.parseResult<string>(orderRes);
        const orderMatch = rawRes.match(/Order Number: \*\*(.*?)\*\*/);
        const urlMatch = rawRes.match(/Payment Link: \*\*(.*?)\*\*/);
        
        if (orderMatch && urlMatch) {
          const order = {
            order_number: orderMatch[1],
            payment_url: urlMatch[1],
            total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
            currency: "LKR"
          };
          
          response = `**Order Created Successfully!**\n\nYour order number is **${order.order_number}**. Please click the secure link below to complete your payment. Once paid, we'll start preparing your items for delivery!`;
          response += `\n\n<ORDER>${JSON.stringify(order)}</ORDER>\n\n<CART_UPDATE>[]</CART_UPDATE>`;
          mood = 'excited';
        } else {
          throw new Error('Failed to parse order from MCP');
        }
      } catch {
        response = `Oops, something went wrong creating your order. Please try again!\n\n<QUICK_REPLIES>["Confirm Order", "Cancel"]</QUICK_REPLIES>`;
      }
    }
    // DYNAMIC CITY CHECK
    else if (cart.length > 0 && message.length > 2 && message.split(' ').length <= 3 && !lower.includes('show') && !lower.includes('find') && !lower.includes('search')) {
      const cityResult = await mcpClient.listDeliveryCities(message.trim());
      const cityText = mcpClient.parseResult<string>(cityResult);
      if (cityText.includes('- **')) {
        const cityMatch = cityText.match(/- \*\*([^*]+)\*\*/);
        const matchedCityName = cityMatch ? cityMatch[1] : message.trim();
        
        // Update memory with city
        setMemory(sessionId, mergeMemory(updatedMemory, { deliveryCity: matchedCityName }));
        
        response = `Delivery to **${matchedCityName}** confirmed!\n\nNow, what **date** do you need it delivered? (e.g., 2026-06-15)\n\nOr I can check what's available:`;
        response += `\n\n<QUICK_REPLIES>["Tomorrow", "This weekend", "2026-06-15", "As soon as possible"]</QUICK_REPLIES>`;
      }
    }

    if (!response) {
      const heuristicIntent = extractIntentFallback(message);
      mood = heuristicIntent.mood as Mood;

      // SURPRISE ME
      if (lower.match(/surprise me|random gift/i)) {
        const surpriseCategories = ['birthday cake', 'gift hamper', 'premium chocolate', 'flower bouquet', 'electronics'];
        const randomCat = surpriseCategories[Math.floor(Math.random() * surpriseCategories.length)];
        try {
          const result = await mcpClient.searchProducts({ query: randomCat, in_stock_only: true, limit: 4 });
          const text = mcpClient.parseResult<string>(result);
          productsTag = await parseProductsFromMarkdown(text);
        } catch { /* MCP unavailable */ }
        
        if (productsTag) {
          response = `Wildcard mode! Here's what I picked at random — you might love it. ✨\n\n${productsTag}\n\n<QUICK_REPLIES>["Show me more", "Try another surprise", "Browse by category"]</QUICK_REPLIES>`;
        } else {
          response = `Wildcard mode! MCP is loading up — try one of these categories to explore:\n\n<QUICK_REPLIES>["Show me cakes", "Show me flowers", "Show me electronics", "Show me gift hampers"]</QUICK_REPLIES>`;
        }
        mood = 'excited';
      }
      // EMOTIONAL SHOPPING
      else if (heuristicIntent.is_shopping && heuristicIntent.emotion !== 'neutral' && heuristicIntent.search_queries.length > 0) {
        const emotionalPrefixes: Record<string, string> = {
          sad: `That's rough — let me find something that'll help. 💛`,
          anxious: `Don't worry, I'm on it! Let me find something right away.`,
          excited: `Love that energy! 🎉 Let me find something to match the celebration!`,
          romantic: `Let me help you make it special! 💕`,
          angry: `Let's fix this — I know just what to look for.`,
          grateful: `What a thoughtful gesture! Let me find something meaningful.`,
          urgent: `On it — no time to waste!`,
        };

        const prefix = emotionalPrefixes[heuristicIntent.emotion] || 'On it!';
        const bestQuery = heuristicIntent.search_queries[0];
        try {
          const result = await mcpClient.searchProducts({
            query: bestQuery,
            in_stock_only: true,
            limit: 5,
            ...(heuristicIntent.budget ? { max_price: heuristicIntent.budget.max } : {}),
          });
          const text = mcpClient.parseResult<string>(result);
          productsTag = await parseProductsFromMarkdown(text);

          if (!productsTag && heuristicIntent.search_queries.length > 1) {
            const secondQuery = heuristicIntent.search_queries[1];
            const result2 = await mcpClient.searchProducts({ query: secondQuery, in_stock_only: true, limit: 5 });
            const text2 = mcpClient.parseResult<string>(result2);
            productsTag = await parseProductsFromMarkdown(text2);
          }
        } catch { /* MCP unavailable */ }

        if (productsTag) {
          const occasionNote = heuristicIntent.occasion !== 'none' && heuristicIntent.occasion !== 'everyday shopping'
            ? ` for this ${heuristicIntent.occasion}` : '';
          const targetNote = heuristicIntent.gift_target !== 'unknown' && heuristicIntent.gift_target !== 'self'
            ? ` for your ${heuristicIntent.gift_target}` : '';
          
          response = `${prefix}\n\nThese look like great picks${targetNote}${occasionNote}:\n\n${productsTag}\n\n<QUICK_REPLIES>["Add to cart", "Show me more options", "Find something cheaper"]</QUICK_REPLIES>`;
        } else {
          response = `${prefix}\n\nI couldn't find exact matches right now — let me suggest some alternatives!\n\n<QUICK_REPLIES>["Show me flowers", "Show me chocolates", "Show me gift hampers", "Browse categories"]</QUICK_REPLIES>`;
        }
      }
      // Regular search
      else if (heuristicIntent.is_shopping && heuristicIntent.search_queries.length > 0) {
        const query = heuristicIntent.search_queries[0];
        try {
          const result = await mcpClient.searchProducts({ query, in_stock_only: true, limit: 5 });
          const text = mcpClient.parseResult<string>(result);
          productsTag = await parseProductsFromMarkdown(text);
        } catch { /* MCP unavailable */ }

        if (productsTag) {
          response = `Found these for "${query}" — take a look!\n\n${productsTag}\n\n<QUICK_REPLIES>["Add to cart", "Show me more", "Compare these", "Find something cheaper"]</QUICK_REPLIES>`;
        } else {
          response = `I searched for "${query}" but couldn't load results right now. Try one of these:\n\n<QUICK_REPLIES>["Show me birthday gifts", "Browse categories", "Show me flowers", "Show me chocolates"]</QUICK_REPLIES>`;
        }
      }
      // Categories
      else if (lower.includes('categor') || lower.includes('browse') || lower.includes('what do you have') || lower.includes('what can')) {
        let text = '';
        try {
          const result = await mcpClient.listCategories();
          text = mcpClient.parseResult<string>(result);
        } catch { /* MCP unavailable */ }
        
        const categories: {name: string, url: string, slug: string}[] = [];
        if (text) {
          const catRegex = /-\s+\[(.*?)\]\((.*?\/([^\/]+))\)/g;
          let match;
          while ((match = catRegex.exec(text)) !== null) {
            categories.push({ name: match[1], url: match[2], slug: match[3] });
          }
        }

        if (categories.length > 0) {
          response = `Here's what Kapruka has in store!\n\n<CATEGORIES>${JSON.stringify(categories)}</CATEGORIES>\n\n<QUICK_REPLIES>["Show me cakes", "Show me flowers", "Show me gifts", "Show me electronics"]</QUICK_REPLIES>`;
        } else {
          response = text
            ? `Here's what Kapruka has in store!\n\n${text}\n\n<QUICK_REPLIES>["Show me cakes", "Show me flowers", "Show me gifts", "Show me electronics"]</QUICK_REPLIES>`
            : `Kapruka has a huge range — cakes, flowers, electronics, groceries, fashion, gifts, and more.\n\n<QUICK_REPLIES>["Show me cakes", "Show me flowers", "Show me electronics", "Show me gift hampers"]</QUICK_REPLIES>`;
        }
      }
      // Gift mode
      else if (lower.includes('gift') || lower.includes('present') || lower.includes('surprise for') || lower.includes('birthday for')) {
        response = `Gift mode — let's find something perfect! 🎁\n\nWho's it for and what's your budget? (e.g. "For my wife, under Rs. 5000")\n\n<QUICK_REPLIES>["Show me popular gifts", "For my mom", "For my girlfriend", "Browse gift categories"]</QUICK_REPLIES>`;
        mood = 'warm';
      }
      // Tracking Check
      else if (lower.match(/(kap\d+|vimp[a-z0-9]+)/i)) {
        const match = message.match(/(kap\d+|vimp[a-z0-9]+)/i);
        const orderNum = match ? match[1].toUpperCase() : '';
        try {
          const trackResult = await mcpClient.trackOrder(orderNum);
          const trackText = mcpClient.parseResult<string>(trackResult);
          response = `Tracking info for order **${orderNum}**:\n\n${trackText}\n\n<QUICK_REPLIES>["Track another order", "Browse products", "Show me gifts"]</QUICK_REPLIES>`;
        } catch {
          response = `Couldn't find tracking info for **${orderNum}**. Is the number correct?\n\n<QUICK_REPLIES>["Try again", "Browse products"]</QUICK_REPLIES>`;
        }
      }
      // Tracking Prompt
      else if (lower.includes('track') || lower.includes('order status') || lower.includes('where is my')) {
        response = `Sure! Give me your Kapruka order number (e.g., VIMP34456CB2) and I'll look it up.\n\n<QUICK_REPLIES>["I don't have my order number", "Browse products instead"]</QUICK_REPLIES>`;
      }
      // Greetings
      else if (lower.match(/^(hi|hello|hey|good morning|good evening|good afternoon|howdy|sup|yo|ayubowan|vanakkam)/)) {
        const hour = new Date().getHours();
        let greeting = 'Hello';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        else greeting = 'Good evening';
        
        response = `${greeting}! I'm KASA — your shopping concierge for Kapruka.com. \n\nI can find electronics, groceries, cakes, flowers, gifts, and more. What are you looking for?\n\n<QUICK_REPLIES>["Show me trending items", "Birthday gift ideas", "Browse categories", "Surprise me!"]</QUICK_REPLIES>`;
        mood = 'warm';
      }
      // Default
      else {
        response = `I'm here to help you shop Kapruka! ✨ What are you looking for?\n\n<QUICK_REPLIES>["Show me electronics", "Birthday gifts", "Browse categories", "Track my order"]</QUICK_REPLIES>`;
      }
    }
  } catch {
    response = `I'm having a moment connecting to the shop. Let me try again!\n\n<QUICK_REPLIES>["Try again", "Browse categories", "Show me gifts"]</QUICK_REPLIES>`;
  }

  // Add mood tag to response
  response = urgencyPrefix + response + `\n<MOOD>${mood}</MOOD>`;
  setLastMood(sessionId, mood);

  return { text: response, mood };
}

// ── v4.0 Response Enrichment Pipeline ───────────────────────────
function enrichResponseWithProducts(
  products: Product[],
  sessionId: string,
  intent: ExtractedIntent,
  isGiftMode: boolean
): Product[] {
  const memory = getMemory(sessionId);
  
  // Step 1: Rank products using intelligence
  const ranked = rankProducts(products, {
    memory,
    searchQuery: intent.search_queries[0] || '',
    isGiftMode,
  });

  // Step 2: Ghost cart predictions for top products
  const predictions = predictLikelyAdditions(intent, ranked, sessionId);
  if (predictions.length > 0) {
    const ghostItems = ranked
      .filter(p => predictions.includes(p.product_id))
      .map(p => createGhostCartItem(p, 0.7));
    addToGhostCart(sessionId, ghostItems);
  }

  return ranked;
}

// ── Main POST Handler ───────────────────────────────────────────
export async function POST(request: Request) {
  try {
    // ── Rate Limiting ──
    const { limited, resetAt } = checkRateLimit(request, { maxRequests: 30, windowMs: 60_000 });
    if (limited) return rateLimitResponse(resetAt);

    const body = (await request.json()) as ChatRequestBody;
    const {
      message: rawMessage,
      sessionId,
      language = 'en',
      cart = [],
      giftMode = false,
      deliveryCity,
    } = body;

    // ── Input Sanitization ──
    const message = sanitizeInput(rawMessage);

    if (!message || !sessionId) {
      return new Response('Please type a message to get started!', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // ── Step 1: Update Conversation Memory ──
    const currentMemory = getMemory(sessionId);
    const memoryUpdates = extractMemoryFromMessage(message, currentMemory, cart);
    const updatedMemory = mergeMemory(currentMemory, memoryUpdates);
    if (deliveryCity && !updatedMemory.deliveryCity) {
      updatedMemory.deliveryCity = deliveryCity;
    }
    setMemory(sessionId, updatedMemory);

    // ── Step 2: Try AI-powered response ──
    const modelConfig = getModel();

    if (modelConfig) {
      try {
        if (process.env.NODE_ENV === 'development') console.log(`[KASA] Using ${modelConfig.provider}`);

        // Deep Intent Extraction (AI-powered)
        const lastAssistantMsg = getConversation(sessionId)?.slice(-1)[0]?.content || '';
        const conversationContext = cart.length > 0
          ? `Cart has ${cart.length} items. ${lastAssistantMsg.slice(0, 150)}`
          : lastAssistantMsg.slice(0, 200);

        const extractedIntent = await extractIntent(
          modelConfig.model,
          message,
          conversationContext
        );
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[KASA] Intent:`, JSON.stringify({
            emotion: extractedIntent.emotion,
            mood: extractedIntent.mood,
            intent: extractedIntent.intent_category,
            shopping: extractedIntent.is_shopping,
            queries: extractedIntent.search_queries,
            confidence: extractedIntent.confidence,
          }));
        }

        // Update memory with intent signals
        if (extractedIntent.occasion && extractedIntent.occasion !== 'none') {
          updatedMemory.occasion = extractedIntent.occasion;
        }
        if (extractedIntent.gift_target && extractedIntent.gift_target !== 'unknown') {
          updatedMemory.giftTarget = extractedIntent.gift_target;
        }
        if (extractedIntent.budget) {
          updatedMemory.budget = extractedIntent.budget;
        }
        if (extractedIntent.search_queries.length > 0) {
          updatedMemory.lastSearchQueries = extractedIntent.search_queries;
        }
        setMemory(sessionId, updatedMemory);
        setLastMood(sessionId, extractedIntent.mood as Mood);

        // Execute MCP tools
        const festivalContext = getFestivalContext();
        const systemPrompt = buildSystemPrompt(
          language, giftMode, cart, deliveryCity ?? null,
          festivalContext, extractedIntent, updatedMemory
        );
        const mcpData = await executeMCPToolsWithIntent(message, extractedIntent);

        // Extract pre-formatted products
        let preFormattedTag = '';
        let mcpDataForAI = mcpData;
        const pfMarker = '[PRE-FORMATTED PRODUCTS WITH REAL IMAGES';
        const pfIdx = mcpData.indexOf(pfMarker);
        if (pfIdx !== -1) {
          const tagMatch = mcpData.slice(pfIdx).match(/<PRODUCTS>[\s\S]*?<\/PRODUCTS>/);
          if (tagMatch) {
            // v4.0: Run product ranking on pre-formatted products
            try {
              const productsMatch = tagMatch[0].match(/<PRODUCTS>([\s\S]*?)<\/PRODUCTS>/);
              if (productsMatch) {
                const rawProducts = JSON.parse(productsMatch[1]) as Product[];
                const rankedProducts = enrichResponseWithProducts(
                  rawProducts, sessionId, extractedIntent, giftMode
                );
                preFormattedTag = `<PRODUCTS>${JSON.stringify(rankedProducts)}</PRODUCTS>`;
              }
            } catch {
              preFormattedTag = tagMatch[0];
            }
          }
          mcpDataForAI = mcpData.slice(0, pfIdx).trim();
        }

        let history = getConversation(sessionId);
        const noProductsTagInstruction = preFormattedTag
          ? `\n\n[IMPORTANT: Do NOT output a <PRODUCTS> tag. Real product data with images will be appended automatically after your response. Just write your conversational text.]`
          : '';
        const userContent = mcpDataForAI
          ? `${message}\n\n--- TOOL RESULTS ---\n${mcpDataForAI}${noProductsTagInstruction}`
          : message;

        history.push({ role: 'user' as const, content: userContent });
        if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);

        // Generate response
        const result = streamText({
          model: modelConfig.model,
          system: systemPrompt,
          messages: history,
          temperature: 0.7,
          onFinish: async (event) => {
            if (event.text) {
              history.push({ role: 'assistant' as const, content: event.text + (preFormattedTag ? '\n' + preFormattedTag : '') });
              setConversation(sessionId, history);
            }
          },
        });

        // Inject pre-formatted products at end of stream
        if (preFormattedTag) {
          const encoder = new TextEncoder();
          const injectTag = preFormattedTag;
          
          let streamDone = false;
          const transform = new TransformStream({
            transform(chunk, controller) {
              controller.enqueue(chunk);
            },
            flush(controller) {
              if (!streamDone) {
                streamDone = true;
                controller.enqueue(encoder.encode(`\n${injectTag}`));
              }
            },
          });

          const baseResponse = result.toTextStreamResponse();
          const transformedBody = baseResponse.body!.pipeThrough(transform);
          return new Response(transformedBody, {
            headers: baseResponse.headers,
          });
        }

        return result.toTextStreamResponse();
      } catch (aiError: unknown) {
        if (process.env.NODE_ENV === 'development') console.error(`[KASA] AI error, falling back:`, aiError);
      }
    }

    // ── Step 3: Smart Fallback ──
    if (process.env.NODE_ENV === 'development') console.log('[KASA] Using smart fallback (no AI key)');
    const { text: fallbackResponse } = await generateFallbackResponse(sessionId, message, cart);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < fallbackResponse.length; i++) {
          controller.enqueue(encoder.encode(fallbackResponse[i]));
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') console.error('[KASA Chat] Error:', error);
    const msg = error instanceof Error ? error.message : 'Something went wrong';
    return new Response(`Oops! Something went wrong: ${msg}. Please try again!`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
