import type {
  Product,
  DeliveryInfo,
  OrderResult,
  TrackingInfo,
  CartItem,
  Category,
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
  categories?: Category[];
}

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function extractTag<T>(
  text: string,
  tagName: string
): { data: T | null; cleaned: string } {
  // Use a simple string search approach that's more reliable than regex
  const openTag = `<${tagName}>`;
  const closeTag = `</${tagName}>`;

  const startIdx = text.indexOf(openTag);
  if (startIdx === -1) {
    return { data: null, cleaned: text };
  }

  const contentStart = startIdx + openTag.length;
  const endIdx = text.indexOf(closeTag, contentStart);
  if (endIdx === -1) {
    return { data: null, cleaned: text };
  }

  const rawContent = text.slice(contentStart, endIdx).trim();
  const parsed = safeParse<T>(rawContent);
  const cleaned = (text.slice(0, startIdx) + text.slice(endIdx + closeTag.length)).trim();

  return { data: parsed, cleaned };
}

export function parseAssistantResponse(rawText: string): ParsedResponse {
  let text = rawText;

  const productsResult = extractTag<Product[]>(text, 'PRODUCTS');
  text = productsResult.cleaned;

  const quickRepliesResult = extractTag<string[]>(text, 'QUICK_REPLIES');
  text = quickRepliesResult.cleaned;

  const deliveryResult = extractTag<DeliveryInfo>(text, 'DELIVERY');
  text = deliveryResult.cleaned;

  const orderResult = extractTag<OrderResult>(text, 'ORDER');
  text = orderResult.cleaned;

  const trackingResult = extractTag<TrackingInfo>(text, 'TRACKING');
  text = trackingResult.cleaned;

  const cartUpdateResult = extractTag<CartItem[]>(text, 'CART_UPDATE');
  text = cartUpdateResult.cleaned;

  const categoriesResult = extractTag<Category[]>(text, 'CATEGORIES');
  text = categoriesResult.cleaned;

  // Clean excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  const result: ParsedResponse = { text };

  if (productsResult.data && Array.isArray(productsResult.data) && productsResult.data.length > 0) {
    result.products = productsResult.data;
    if (productsResult.data.length > 2) {
      result.comparison = productsResult.data;
    }
  }

  if (quickRepliesResult.data && Array.isArray(quickRepliesResult.data) && quickRepliesResult.data.length > 0) {
    result.quickReplies = quickRepliesResult.data.filter((r) => typeof r === 'string');
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

  if (cartUpdateResult.data && Array.isArray(cartUpdateResult.data) && cartUpdateResult.data.length > 0) {
    result.cartUpdate = cartUpdateResult.data;
  }

  if (categoriesResult.data && Array.isArray(categoriesResult.data) && categoriesResult.data.length > 0) {
    result.categories = categoriesResult.data;
  }

  return result;
}
