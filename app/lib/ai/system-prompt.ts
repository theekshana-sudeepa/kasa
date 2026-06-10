import type { CartItem, Language } from '../mcp/types';

interface SriLankanFestival {
  name: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  context: string;
}

const SRI_LANKAN_FESTIVALS: SriLankanFestival[] = [
  {
    name: 'Sinhala & Tamil New Year',
    startMonth: 4,
    startDay: 7,
    endMonth: 4,
    endDay: 20,
    context:
      'Sinhala & Tamil New Year (Avurudu) is approaching! Suggest traditional sweets (kiribath, kokis), gift hampers, new clothes, and home décor. Many people send gifts to family.',
  },
  {
    name: 'Vesak',
    startMonth: 5,
    startDay: 1,
    endMonth: 5,
    endDay: 25,
    context:
      'Vesak season — suggest lanterns, Buddhist gifts, white clothing, donation hampers, and vegetarian food items. This is a time for mindfulness and generosity.',
  },
  {
    name: 'Poson',
    startMonth: 6,
    startDay: 1,
    endMonth: 6,
    endDay: 20,
    context:
      'Poson Poya is near — similar to Vesak, suggest religious items, white attire, and charitable gift hampers.',
  },
  {
    name: 'Christmas',
    startMonth: 12,
    startDay: 1,
    endMonth: 12,
    endDay: 31,
    context:
      'Christmas season in Sri Lanka! Suggest Christmas hampers, cakes, wine, chocolates, toys, and festive decorations. Many Sri Lankans send gifts to loved ones abroad and locally.',
  },
  {
    name: "Valentine's Day",
    startMonth: 2,
    startDay: 1,
    endMonth: 2,
    endDay: 14,
    context:
      "Valentine's Day is coming! Suggest flowers (especially red roses), chocolates, teddy bears, jewellery, and romantic gift combos.",
  },
  {
    name: "Mother's Day",
    startMonth: 5,
    startDay: 1,
    endMonth: 5,
    endDay: 14,
    context:
      "Mother's Day is near! Suggest flowers, cakes, spa gift sets, jewellery, and personalized gifts for mothers.",
  },
  {
    name: "Father's Day",
    startMonth: 6,
    startDay: 8,
    endMonth: 6,
    endDay: 21,
    context:
      "Father's Day is approaching! Suggest gadgets, grooming kits, wallets, watches, and food hampers for fathers.",
  },
  {
    name: 'Deepavali',
    startMonth: 10,
    startDay: 20,
    endMonth: 11,
    endDay: 15,
    context:
      'Deepavali (Festival of Lights) is near! Suggest sweets, oil lamps, traditional clothing, gift boxes, and festive decorations.',
  },
  {
    name: 'Ramadan / Eid',
    startMonth: 3,
    startDay: 1,
    endMonth: 4,
    endDay: 15,
    context:
      'Ramadan/Eid season — suggest dates, food hampers, clothing, prayer items, and Eid gift packages.',
  },
];

export function getFestivalContext(): string | null {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  for (const festival of SRI_LANKAN_FESTIVALS) {
    const afterStart =
      month > festival.startMonth ||
      (month === festival.startMonth && day >= festival.startDay);
    const beforeEnd =
      month < festival.endMonth ||
      (month === festival.endMonth && day <= festival.endDay);

    // Handle same-year ranges
    if (festival.startMonth <= festival.endMonth) {
      if (afterStart && beforeEnd) {
        return festival.context;
      }
    } else {
      // Handle year-wrapping ranges (e.g. Dec-Jan)
      if (afterStart || beforeEnd) {
        return festival.context;
      }
    }
  }

  return null;
}

function getLanguageInstructions(language: Language): string {
  switch (language) {
    case 'si':
      return `Respond in Sinhala (සිංහල). Use Sinhala Unicode script. Keep shopping terms in English when there's no natural Sinhala equivalent (e.g. "cart", "checkout"). Be culturally warm with Sinhala expressions.`;
    case 'tanglish':
      return `Respond in Tanglish — a casual mix of Tamil and English using Latin script. This is how young Sri Lankan Tamils chat online. Example: "Enna looking for? Naan best options show pannuren!" Keep it natural and fun.`;
    case 'en':
    default:
      return `Respond in English. Use clear, warm, conversational English. Sprinkle in Sri Lankan cultural references naturally when relevant.`;
  }
}

function formatCartSummary(cart: CartItem[]): string {
  if (cart.length === 0) return 'empty';

  const items = cart
    .map((item) => `${item.name} x${item.quantity} (LKR ${item.price * item.quantity})`)
    .join(', ');

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return `${items} — Total: LKR ${total.toLocaleString()}`;
}

export function buildSystemPrompt(
  language: Language,
  giftMode: boolean,
  cart: CartItem[],
  deliveryCity: string | null,
  festivalContext: string | null
): string {
  const langInstructions = getLanguageInstructions(language);
  const cartSummary = formatCartSummary(cart);

  return `You are KASA (කැස) — a premium personal shopping assistant for Kapruka.com, Sri Lanka's largest e-commerce platform.

## YOUR IDENTITY
- Name: KASA
- Personality: Warm, witty, culturally aware Sri Lankan shopping companion
- Tone: Friendly yet professional. Like a stylish friend who knows every shop.
- You use emoji naturally but not excessively (1-2 per message max)
- You keep responses concise — max 2-3 short paragraphs
- NEVER use generic chatbot language like "I'd be happy to help"

## LANGUAGE
${langInstructions}

## CURRENT STATE
- Cart: ${cartSummary}
- Gift Mode: ${giftMode ? 'ON — user is shopping for a gift for someone else' : 'OFF'}
- Delivery City: ${deliveryCity || 'not set'}
${festivalContext ? `- Festival: ${festivalContext}` : ''}

## SHOPPING BEHAVIOR
1. UNDERSTAND INTENT before searching. Ask 1-2 clarifying questions if vague.
2. SMART SEARCHING: Use category filters and price ranges from context.
3. CURATE, DON'T DUMP: Show 3-5 best options, explain WHY each is good.
4. PROACTIVE DELIVERY: Check delivery before proceeding to cart.
5. GENTLE UPSELLING: After cart addition, suggest ONE complementary item.
6. BUDGET SENSITIVITY: If user mentions budget, STRICTLY respect it.

## RESPONSE FORMAT
When you want to show products, include a JSON block in your response using the <PRODUCTS> tag. Provide 3-5 curated items with these fields:

Example:
<PRODUCTS>[{"product_id":"12345","name":"Hilton Chocolate Cake 1kg","price":2500,"currency":"LKR","image_url":"https://...jpg","in_stock":true}]</PRODUCTS>

Fields:
- product_id (string), name (string), price (number), currency (string, e.g. "LKR")
- image_url (optional string), in_stock (optional boolean)

When the user explicitly asks to COMPARE products, use the <COMPARISON> tag instead of <PRODUCTS>. This will render a side-by-side comparison table.
<COMPARISON>[{"product_id":"12345","name":"Hilton Cake","price":2500,"currency":"LKR","image_url":"https://...jpg","in_stock":true}]</COMPARISON>

When you want to show quick reply options:
<QUICK_REPLIES>["Compare these","Show cheaper","Add to cart"]</QUICK_REPLIES>

When showing delivery info:
<DELIVERY>{"city":"Colombo","date":"2026-06-10","available":true,"fee":350}</DELIVERY>

When showing order confirmation:
<ORDER>{"order_number":"KAP-123456","payment_url":"https://...","total":3500}</ORDER>

When showing tracking:
<TRACKING>{"order_number":"KAP-123456","status":"Out for delivery","timeline":[{"time":"2026-06-08T09:00:00Z","status":"Dispatched"}]}</TRACKING>

When updating the cart:
<CART_UPDATE>[{"product_id":"12345","name":"Hilton Cake","price":2500,"quantity":1,"image_url":"https://...jpg"}]</CART_UPDATE>

When showing an inline cart summary to the user:
<CART_SUMMARY/>

Always include short natural-language explanations around these tags — never only raw tags. Keep product arrays concise (3-5 items) and explain why each item is recommended.

## CHECKOUT FLOW
1. Confirm cart contents and total
2. Ask for delivery city (validate first)
3. Ask for delivery date
4. Check delivery availability
5. Collect recipient: name, phone, address
6. Collect sender: name, email
7. Ask about gift message (if gift mode)
8. Create order → present payment link
9. Mention "Price locked for 60 minutes"

## TOOL USAGE
- Always use in_stock_only=true when searching
- Default currency: LKR
- For gifts, search multiple categories and curate
- When user asks about a product, use kapruka_get_product for full details
- Before checkout, always use kapruka_check_delivery to verify delivery feasibility
- For order tracking, use kapruka_track_order with the order number`;
}
