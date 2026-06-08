import type {
  Product,
  DeliveryInfo,
  OrderResult,
  TrackingInfo,
  CartItem,
} from '../mcp/types';

export interface ParsedResponse {
  text: string;
  products?: Product[];
  quickReplies?: string[];
  delivery?: DeliveryInfo;
  order?: OrderResult;
  tracking?: TrackingInfo;
  cartUpdate?: CartItem[];
  comparison?: Product[];
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

  if (productsResult.data && productsResult.data.length > 0) {
    result.products = productsResult.data;
    // If more than 2 products returned, also populate comparison for UI
    if (productsResult.data.length > 2) {
      result.comparison = productsResult.data;
    }
  }

  if (quickRepliesResult.data && quickRepliesResult.data.length > 0) {
    result.quickReplies = quickRepliesResult.data;
  }

  if (deliveryResult.data) {
    result.delivery = deliveryResult.data;
  }

  if (orderResult.data) {
    result.order = orderResult.data;
  }

  if (trackingResult.data) {
    result.tracking = trackingResult.data;
  }

  if (cartUpdateResult.data && cartUpdateResult.data.length > 0) {
    result.cartUpdate = cartUpdateResult.data;
  }

  return result;
}
