import { z } from 'zod';
import type {
  Product as MCPProduct,
  DeliveryInfo as MCPDelivery,
  OrderResult as MCPOrder,
  TrackingInfo as MCPTracking,
  CartItem as MCPCartItem,
} from '../mcp/types';

const ProductSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  price: z.number(),
  image_url: z.string().optional(),
  currency: z.string().optional(),
  in_stock: z.boolean().optional(),
});

const DeliverySchema = z.object({
  city: z.string(),
  date: z.string().optional(),
  available: z.boolean(),
  fee: z.number().optional(),
});

const OrderSchema = z.object({
  order_number: z.string(),
  payment_url: z.string().url(),
  total: z.number(),
});

const TrackingSchema = z.object({
  order_number: z.string(),
  status: z.string(),
  timeline: z.array(z.any()).optional(),
});

const CartItemSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  image_url: z.string().optional(),
});

export interface ParsedResponse {
  text: string;
  products?: MCPProduct[];
  quickReplies?: string[];
  delivery?: MCPDelivery;
  order?: MCPOrder;
  tracking?: MCPTracking;
  cartUpdate?: MCPCartItem[];
  comparison?: MCPProduct[];
}

/**
 * Safely parse JSON from a string, returning null on failure.
 */
function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Extract content between matched XML-like tags and return both
 * the parsed data and the text with those tags removed.
 */
function extractTag<T>(
  text: string,
  tagName: string
): { data: T | null; cleaned: string } {
  const regex = new RegExp(
    `<${tagName}>([\\s\\S]*?)</${tagName}>`,
    'i'
  );
  const match = text.match(regex);

  if (!match) {
    return { data: null, cleaned: text };
  }

  const rawContent = match[1].trim();
  const parsed = safeParse<T>(rawContent);
  const cleaned = text.replace(match[0], '').trim();

  return { data: parsed, cleaned };
}

/**
 * Parse an assistant response, extracting structured data from special tags
 * and returning clean display text alongside the parsed objects.
 */
export function parseAssistantResponse(rawText: string): ParsedResponse {
  let text = rawText;

  // Extract products
  const productsResult = extractTag<Product[]>(text, 'PRODUCTS');
  text = productsResult.cleaned;

  // Extract quick replies
  const quickRepliesResult = extractTag<string[]>(text, 'QUICK_REPLIES');
  text = quickRepliesResult.cleaned;

  // Extract delivery info
  const deliveryResult = extractTag<DeliveryInfo>(text, 'DELIVERY');
  text = deliveryResult.cleaned;

  // Extract order result
  const orderResult = extractTag<OrderResult>(text, 'ORDER');
  text = orderResult.cleaned;

  // Extract tracking info
  const trackingResult = extractTag<TrackingInfo>(text, 'TRACKING');
  text = trackingResult.cleaned;

  // Extract cart update
  const cartUpdateResult = extractTag<CartItem[]>(text, 'CART_UPDATE');
  text = cartUpdateResult.cleaned;

  // Clean up any excessive whitespace / blank lines left from tag removal
  text = text
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const result: ParsedResponse = { text };

  // Validate and assign products
  if (productsResult.data && Array.isArray(productsResult.data)) {
    const ok: MCPProduct[] = [];
    for (const p of productsResult.data) {
      const parsed = ProductSchema.safeParse(p);
      if (parsed.success) ok.push(parsed.data as MCPProduct);
      else console.warn('[KASA Parse] Invalid product schema', parsed.error.format());
    }
    if (ok.length > 0) {
      result.products = ok;
      if (ok.length > 2) result.comparison = ok;
    }
  }

  if (quickRepliesResult.data && Array.isArray(quickRepliesResult.data)) {
    result.quickReplies = quickRepliesResult.data.filter((r) => typeof r === 'string');
  }

  if (deliveryResult.data) {
    const parsed = DeliverySchema.safeParse(deliveryResult.data);
    if (parsed.success) result.delivery = parsed.data as MCPDelivery;
    else console.warn('[KASA Parse] Invalid delivery schema', parsed.error.format());
  }

  if (orderResult.data) {
    const parsed = OrderSchema.safeParse(orderResult.data);
    if (parsed.success) result.order = parsed.data as MCPOrder;
    else console.warn('[KASA Parse] Invalid order schema', parsed.error.format());
  }

  if (trackingResult.data) {
    const parsed = TrackingSchema.safeParse(trackingResult.data);
    if (parsed.success) result.tracking = parsed.data as MCPTracking;
    else console.warn('[KASA Parse] Invalid tracking schema', parsed.error.format());
  }

  if (cartUpdateResult.data && Array.isArray(cartUpdateResult.data)) {
    const ok: MCPCartItem[] = [];
    for (const c of cartUpdateResult.data) {
      const parsed = CartItemSchema.safeParse(c);
      if (parsed.success) ok.push(parsed.data as MCPCartItem);
      else console.warn('[KASA Parse] Invalid cart item schema', parsed.error.format());
    }
    if (ok.length > 0) result.cartUpdate = ok;
  }

  return result;
}
