import { streamText, generateText } from 'ai';
import { buildSystemPrompt, getFestivalContext } from '@/app/lib/ai/system-prompt';
import { getMCPClient } from '@/app/lib/mcp/client';
import type { CartItem, Language } from '@/app/lib/mcp/types';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };
const conversations = new Map<string, Message[]>();
const fallbackMemory = new Map<string, Record<string, any>>();
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

// Get AI model if available
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
  } catch (err) {
    console.error('[KASA] Failed to load AI provider:', err);
  }
  return null;
}

// Parse MCP markdown search results and fetch real images
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

  // Parse: **N. Product Name**\n   ID: `xxx` · LKR N,NNN
  const productRegex = /\*\*\d+\.\s+(.+?)\*\*\s*\n\s*ID:\s*`([^`]+)`\s*·\s*LKR\s*([\d,]+)/g;
  let match;

  while ((match = productRegex.exec(markdown)) !== null) {
    const name = match[1].trim();
    const productId = match[2].trim();
    const price = parseInt(match[3].replace(/,/g, ''), 10);

    const urlMatch = markdown.slice(match.index).match(/\[View product\]\((https?:\/\/[^\)]+)\)/);
    const url = urlMatch ? urlMatch[1] : `https://www.kapruka.com/buyonline/${productId}`;

    products.push({
      product_id: productId,
      name,
      price,
      currency: 'LKR',
      image_url: '', // Will be filled below
      url,
      in_stock: true,
    });
  }

  // Fetch images for top 2 products only (rest use nice placeholders)
  if (products.length > 0) {
    const topProducts = products.slice(0, 2);
    
    await Promise.race([
      Promise.all(topProducts.map(async (p) => {
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
            }
          }
        } catch { /* skip */ }
      })),
      new Promise(resolve => setTimeout(resolve, 4000)),
    ]);

    // Generate colorful branded placeholders for products without images
    const colors = ['6c5ce7', 'e17055', '00b894', 'fdcb6e', 'e84393'];
    for (let i = 0; i < products.length; i++) {
      if (!products[i].image_url) {
        const color = colors[i % colors.length];
        const text = encodeURIComponent(products[i].name.slice(0, 25));
        products[i].image_url = `https://placehold.co/300x300/${color}/ffffff?text=${text}&font=roboto`;
      }
    }

    return `<PRODUCTS>${JSON.stringify(products)}</PRODUCTS>`;
  }
  return '';
}

// Smart fallback response when no AI key is available
async function generateFallbackResponse(sessionId: string, message: string, cart: any[] = []): Promise<string> {
  const mcpClient = getMCPClient();
  const lower = message.toLowerCase();
  let response = '';
  let productsTag = '';
  let urgencyPrefix = '';
  
  if (lower.match(/\b(urgent|asap|today|emergency|fast|quick)\b/i)) {
    urgencyPrefix = `⚠️ **Urgency Detected:** I see you need this fast! I'll prioritize same-day delivery options available in Colombo & Suburbs.\n\n`;
  }

  try {
    // CHECKOUT INTENT
    if (lower.match(/checkout|place order|buy now/i)) {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const itemLines = cart.map((item) => `• ${item.name} x${item.quantity} — Rs. ${item.price * item.quantity}`);

      if (itemLines.length > 0) {
        response = `Great choice! 🎉 Let's complete your order.\n\n**Your Cart:**\n${itemLines.join('\n')}\n**Total: Rs. ${total}**\n\nTo proceed, I need a few details:\n\n📍 **Which city** should I deliver to?\n📅 **What date** do you need delivery? (YYYY-MM-DD)\n\nJust type the city name to get started!`;
        response += `\n\n<QUICK_REPLIES>["Colombo", "Kandy", "Galle", "Negombo", "Deliver tomorrow"]</QUICK_REPLIES>`;
      } else {
        response = `I'd love to help you checkout! 🛒\n\nTo place your order, I'll need:\n1. 📍 Delivery city\n2. 📅 Delivery date\n3. 👤 Recipient name & phone\n4. 📬 Delivery address\n\nWhich **city** should I deliver to?`;
        response += `\n\n<QUICK_REPLIES>["Colombo", "Kandy", "Galle", "Negombo"]</QUICK_REPLIES>`;
      }
    }
    // DELIVERY DATE RESPONSE
    else if (cart.length > 0 && lower.match(/(tomorrow|today|weekend|asap|as soon as possible|202\d-\d\d-\d\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|mon|tue|wed|thu|fri|sat|sun|next (week|month))/i) && message.split(' ').length <= 6) {
      const date = message.trim();
      let deliveryMsg = `✅ Date confirmed: **${date}**`;
      
      // Perform delivery check using MCP
      // Note: In fallback mode we use a mock check or actual MCP check if we have the city
      const cityToCheck = message.includes('Colombo') ? 'Colombo' : 'Kandy'; // fallback default if not passed perfectly
      try {
        const checkResult = await mcpClient.checkDelivery(cityToCheck, date, cart[0].product_id);
        const checkText = mcpClient.parseResult<string>(checkResult);
        if (checkText.includes('Fee:')) {
          deliveryMsg += `\n\n🚚 ${checkText}`;
        }
      } catch (e) {
        console.error('Delivery check error', e);
      }
      
      fallbackMemory.set(sessionId, { ...(fallbackMemory.get(sessionId) || {}), deliveryDate: date });

      response = `${deliveryMsg}\n\nAlmost done! I just need the recipient's details to deliver the items. Please fill out the secure form below:`;
      response += `\n\n<CHECKOUT_FORM/>`;
    }
    // RE-ENTER DETAILS
    else if (lower.match(/re-enter details|reenter|change details|wrong details|no, let me/i)) {
      response = `No problem! Let's try that again. ✏️\n\nPlease fill out the delivery details below:`;
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

      // Remove prefixes like "Name:", "Phone:" if user typed them
      detailsStr = detailsStr.replace(/name:|phone:|address:|to:/gi, '');
      const parts = detailsStr.split(',').map(s => s.trim());
      
      let name = 'Unknown';
      let phone = 'Unknown';
      let address = 'Unknown';

      // Simple heuristic: Phone is the part with 9+ digits
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

      fallbackMemory.set(sessionId, {
        ...(fallbackMemory.get(sessionId) || {}),
        recipientName: name,
        recipientPhone: phone,
        recipientAddress: address,
        senderName,
        senderEmail
      });

      response = `Great, I've noted the delivery details:\n\n👤 **Name:** ${name}\n📞 **Phone:** ${phone}\n📬 **Address:** ${address}\n\nIs this correct? If yes, how would you like to pay?`;
      response += `\n\n<QUICK_REPLIES>["Credit/Debit Card", "Cash on Delivery", "Bank Transfer", "No, let me re-enter details"]</QUICK_REPLIES>`;
    }
    // PAYMENT METHOD RESPONSE
    else if (lower.match(/credit.*card|debit|cash on delivery|bank transfer|cod/i)) {
      response = `✅ Payment method selected: **${message.trim()}**\n\nI have everything I need to place your order. Please confirm to proceed.`;
      response += `\n\n<QUICK_REPLIES>["Confirm Order", "Cancel"]</QUICK_REPLIES>`;
    }
    // CONFIRM ORDER RESPONSE
    else if (lower.match(/confirm order|pay now/i)) {
      const mem = fallbackMemory.get(sessionId) || {};
      const items = cart.map(c => `${c.product_id}:${c.quantity}`).join(',');
      
      try {
        const orderRes = await mcpClient.callTool('kapruka_create_order', {
          items,
          delivery_city: mem.deliveryCity || 'Colombo',
          delivery_date: mem.deliveryDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
          recipient_name: mem.recipientName || 'Test User',
          recipient_phone: mem.recipientPhone || '0771234567',
          recipient_address: mem.recipientAddress || '123 Test St',
          sender_name: mem.senderName || 'Test Sender',
          sender_email: mem.senderEmail || 'test@test.com'
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
          
          response = `🎉 **Order Created Successfully!**\n\nYour order number is **${order.order_number}**. Please click the secure link below to complete your payment. Once paid, we'll start preparing your items for delivery! 🚀`;
          response += `\n\n<ORDER>${JSON.stringify(order)}</ORDER>\n\n<CART_UPDATE>[]</CART_UPDATE>`;
        } else {
          throw new Error('Failed to parse order from MCP');
        }
      } catch (err) {
        console.error('Failed to create order', err);
        response = `Oops, something went wrong creating your order. Please try again! ⚠️\n\n<QUICK_REPLIES>["Confirm Order", "Cancel"]</QUICK_REPLIES>`;
      }
    }
    // DYNAMIC CITY CHECK (Checkout mode only)
    else if (cart.length > 0 && message.length > 2 && message.split(' ').length <= 3 && !lower.includes('show') && !lower.includes('find') && !lower.includes('search')) {
      const cityResult = await mcpClient.listDeliveryCities(message.trim());
      const cityText = mcpClient.parseResult<string>(cityResult);
      if (cityText.includes('- **')) {
        const cityMatch = cityText.match(/- \*\*([^*]+)\*\*/);
        const matchedCityName = cityMatch ? cityMatch[1] : message.trim();
        
        fallbackMemory.set(sessionId, { ...(fallbackMemory.get(sessionId) || {}), deliveryCity: matchedCityName });
        
        response = `✅ Delivery to **${matchedCityName}** — great!\n\nNow, what **date** do you need it delivered? (e.g., 2026-06-15)\n\nOr I can check what's available:`;
        response += `\n\n<QUICK_REPLIES>["Tomorrow", "This weekend", "2026-06-15", "As soon as possible"]</QUICK_REPLIES>`;
      }
    }

    if (!response) {
      const searchTerms = [
        'show me', 'find', 'search', 'looking for', 'want', 'need',
        'gift', 'buy', 'cake', 'flower', 'chocolate', 'electronic',
        'grocer', 'birthday', 'anniversary', 'wedding', 'toy', 'gadget',
        'phone', 'wine', 'hamper', 'fruit', 'baby', 'jewelry', 'perfume',
        'sweet', 'clothing', 'book', 'surprise',
      ];

      // SURPRISE ME INTENT
      if (lower.match(/surprise me|random gift/i)) {
        const categories = ['cake', 'electronic', 'flower', 'chocolate'];
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        const result = await mcpClient.searchProducts({ query: randomCat, in_stock_only: true, limit: 3 });
        const text = mcpClient.parseResult<string>(result);
        productsTag = await parseProductsFromMarkdown(text);
        
        response = `🎁 **Surprise!** I've pulled some completely random, premium wildcard items for you. How about one of these?\n\n${productsTag}`;
        response += `\n\n<QUICK_REPLIES>["Surprise me again!", "Show me cakes instead", "Browse categories"]</QUICK_REPLIES>`;
      }
      // Search intent
      else if (searchTerms.some(term => lower.includes(term))) {
        let query = message
          .replace(/^(show me|find me|search for|i want|i need|looking for|can you find|get me|i'm looking for|i am looking for)\s*/i, '')
          .replace(/\s*(please|thanks|thank you|pls)$/i, '')
          .trim();
        if (query.length < 2) query = message;

        const result = await mcpClient.searchProducts({ query, in_stock_only: true, limit: 5 });
        const text = mcpClient.parseResult<string>(result);

        productsTag = await parseProductsFromMarkdown(text);

        if (productsTag) {
          response = `Here are some great options I found for "${query}"! 🛍️\n\n${productsTag}\n\nWould you like to know more about any of these, or shall I search for something specific?`;
          response += `\n\n<QUICK_REPLIES>["Tell me more about the first one", "Show me more options", "Add to cart", "Search for something else"]</QUICK_REPLIES>`;
        } else {
          response = `I searched for "${query}" but couldn't find exact matches right now. Let me suggest some alternatives! 🔍\n\n<QUICK_REPLIES>["Show me birthday gifts", "Browse categories", "Show me flowers", "Show me chocolates"]</QUICK_REPLIES>`;
        }
      }
      
      // Categories
      else if (lower.includes('categor') || lower.includes('browse') || lower.includes('what do you have') || lower.includes('what can')) {
        const result = await mcpClient.listCategories();
        const text = mcpClient.parseResult<string>(result);
        
        const categories: {name: string, url: string, slug: string}[] = [];
        const catRegex = /-\s+\[(.*?)\]\((.*?\/([^\/]+))\)/g;
        let match;
        while ((match = catRegex.exec(text)) !== null) {
           categories.push({ name: match[1], url: match[2], slug: match[3] });
        }

        if (categories.length > 0) {
          response = `Here are the categories available on Kapruka! 📋\n\n<CATEGORIES>${JSON.stringify(categories)}</CATEGORIES>\n\n<QUICK_REPLIES>["Show me cakes", "Show me flowers", "Show me gifts", "Show me electronics"]</QUICK_REPLIES>`;
        } else {
          response = `Here are the categories available on Kapruka! 📋\n\n${text}\n\n<QUICK_REPLIES>["Show me cakes", "Show me flowers", "Show me gifts", "Show me electronics"]</QUICK_REPLIES>`;
        }
      }
      // Gift mode
      else if (lower.includes('gift') || lower.includes('present') || lower.includes('surprise for') || lower.includes('birthday for')) {
        response = `🎁 **Gift Mode ON!** Let me help you find the perfect gift.\n\nWho is the lucky person and what's your budget? (e.g. "For my wife, under Rs. 5000")\n\n<QUICK_REPLIES>["Show me popular gifts", "For my mom", "For my girlfriend", "Browse gift categories"]</QUICK_REPLIES>`;
      }
      // Tracking Check
      else if (lower.match(/(kap\d+|vimp[a-z0-9]+)/i)) {
        const match = message.match(/(kap\d+|vimp[a-z0-9]+)/i);
        const orderNum = match ? match[1].toUpperCase() : '';
        try {
           const trackResult = await mcpClient.trackOrder(orderNum);
           const trackText = mcpClient.parseResult<string>(trackResult);
           response = `📦 Here is the tracking information for order **${orderNum}**:\n\n${trackText}\n\n<QUICK_REPLIES>["Track another order", "Browse products", "Show me gifts"]</QUICK_REPLIES>`;
        } catch (e) {
           response = `I couldn't find tracking info for **${orderNum}**. Are you sure the number is correct?\n\n<QUICK_REPLIES>["Try again", "Browse products"]</QUICK_REPLIES>`;
        }
      }
      // Tracking Prompt
      else if (lower.includes('track') || lower.includes('order status') || lower.includes('where is my')) {
        response = `I can help you track your order! 📦 Please provide your Kapruka order number (e.g., VIMP34456CB2).\n\n<QUICK_REPLIES>["I don't have my order number", "Browse products instead"]</QUICK_REPLIES>`;
      }
      // Greetings
      else if (lower.match(/^(hi|hello|hey|good morning|good evening|good afternoon|howdy|sup|yo)/)) {
        response = `Hello! 👋 Welcome to KASA — your personal shopping assistant for Kapruka.com! 🇱🇰\n\nI can help you find perfect gifts, cakes, flowers, electronics, and much more. What are you looking for today?\n\n<QUICK_REPLIES>["Birthday gift ideas", "Show me cakes", "Show me flowers", "Browse categories"]</QUICK_REPLIES>`;
      }
      // Default
      else {
        response = `I'd love to help you shop! 🛍️ I can search for products, browse categories, check delivery availability, or help you checkout.\n\nWhat would you like to explore?\n\n<QUICK_REPLIES>["Show me birthday gifts", "Show me cakes", "Browse categories", "Track my order"]</QUICK_REPLIES>`;
      }
    }
  } catch (err) {
    console.error('[KASA Fallback] Error:', err);
    response = `I'm having a moment connecting to the shop. Let me try again! 🔄\n\n<QUICK_REPLIES>["Try again", "Browse categories", "Show me gifts"]</QUICK_REPLIES>`;
  }

  return urgencyPrefix + response;
}

// Execute MCP tools for AI context
async function executeMCPTools(message: string): Promise<string> {
  const mcpClient = getMCPClient();
  const lower = message.toLowerCase();
  const results: string[] = [];

  try {
    const searchTerms = [
      'show me', 'find', 'search', 'looking for', 'want', 'need',
      'gift', 'buy', 'cake', 'flower', 'chocolate', 'electronic',
      'grocer', 'birthday', 'anniversary', 'wedding', 'toy', 'gadget',
      'phone', 'wine', 'hamper', 'fruit', 'baby', 'jewelry', 'perfume',
    ];

    if (searchTerms.some(term => lower.includes(term))) {
      let query = message
        .replace(/^(show me|find me|search for|i want|i need|looking for|can you find|get me|i'm looking for|i am looking for)\s*/i, '')
        .replace(/\s*(please|thanks|thank you|pls)$/i, '')
        .trim();
      if (query.length < 2) query = message;

      const searchResult = await mcpClient.searchProducts({ query, in_stock_only: true, limit: 5 });
      const parsed = mcpClient.parseResult<string>(searchResult);
      results.push(`[SEARCH RESULTS for "${query}"]:\n${parsed}`);
    }

    if (lower.includes('categor') || lower.includes('browse') || lower.includes('what do you have')) {
      const catResult = await mcpClient.listCategories();
      const parsed = mcpClient.parseResult<string>(catResult);
      results.push(`[CATEGORIES]:\n${parsed}`);
    }

    const trackMatch = message.match(/(?:track|status|where is)\s+(?:order\s*)?(?:#?\s*)?([\w\d]{5,})/i);
    if (trackMatch) {
      const trackResult = await mcpClient.trackOrder(trackMatch[1]);
      const parsed = mcpClient.parseResult<string>(trackResult);
      results.push(`[ORDER TRACKING]:\n${parsed}`);
    }
  } catch (err) {
    console.error('[KASA MCP] Tool error:', err);
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
      return new Response('Please type a message to get started! 😊', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Try AI-powered response first
    const modelConfig = getModel();

    if (modelConfig) {
      try {
        console.log(`[KASA] Using ${modelConfig.provider}`);

        // Step 1: Intent Routing
        const lastAssistantMsg = conversations.get(sessionId)?.slice(-1)[0]?.content || '';
        const intentResult = await generateText({
          model: modelConfig.model,
          system: 'Classify this user message into exactly one intent: SEARCH | GIFT | CHECKOUT | TRACK | BROWSE | URGENT | CASUAL | CLARIFY. Respond with ONLY the intent word. Nothing else.',
          prompt: `Message: "${message}"\nContext clues: "${cart.length > 0 ? 'Cart has items' : 'Cart is empty'}" "${lastAssistantMsg.slice(0, 100)}"`,
          temperature: 0,
        });
        
        // Ensure intent matches one of our expected types
        const rawIntent = intentResult.text.trim().toUpperCase();
        const validIntents = ['SEARCH', 'GIFT', 'CHECKOUT', 'TRACK', 'BROWSE', 'URGENT', 'CASUAL', 'CLARIFY'];
        const detectedIntent = validIntents.includes(rawIntent) ? rawIntent : 'SEARCH';
        
        console.log(`[KASA] Detected Intent: ${detectedIntent}`);

        const festivalContext = getFestivalContext();
        const systemPrompt = buildSystemPrompt(language, giftMode, cart, deliveryCity ?? null, festivalContext, detectedIntent);
        const mcpData = await executeMCPTools(message);

        let history = conversations.get(sessionId) ?? [];
        const userContent = mcpData
          ? `${message}\n\n--- TOOL RESULTS (format products using <PRODUCTS> JSON tags) ---\n${mcpData}`
          : message;

        history.push({ role: 'user' as const, content: userContent });
        if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);

        const result = streamText({
          model: modelConfig.model,
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
      } catch (aiError) {
        console.error(`[KASA] AI error, falling back:`, aiError);
        // Fall through to smart fallback
      }
    }

    // Smart fallback — works without any AI key!
    console.log('[KASA] Using smart fallback (no AI key)');
    const fallbackResponse = await generateFallbackResponse(sessionId, message, cart);

    // Stream the fallback response character by character for realistic feel
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
  } catch (error) {
    console.error('[KASA Chat] Error:', error);
    const msg = error instanceof Error ? error.message : 'Something went wrong';
    return new Response(`Oops! Something went wrong: ${msg}. Please try again! 🔄`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
