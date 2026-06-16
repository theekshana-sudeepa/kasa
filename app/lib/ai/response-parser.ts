import type {
  Product,
  DeliveryInfo,
  OrderResult,
  TrackingInfo,
  CartItem,
  Category,
} from '../mcp/types';
import { enforceHumanTone } from './tone-enforcement';

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
  checkoutForm?: boolean;
  showCartSummary?: boolean;
  tenSecondDecision?: Product;
  groupGift?: { goal: number; productName: string };
  giftMessage?: string;
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
    // Tag is open but not closed yet (streaming).
    // Hide the incomplete tag and its contents from the cleaned text.
    const cleaned = text.slice(0, startIdx).trim();
    return { data: null, cleaned };
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

  const comparisonResult = extractTag<Product[]>(text, 'COMPARISON');
  text = comparisonResult.cleaned;

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

  const tenSecondDecisionResult = extractTag<Product>(text, 'TEN_SECOND_DECISION');
  text = tenSecondDecisionResult.cleaned;

  const groupGiftResult = extractTag<{ goal: number; productName: string }>(text, 'GROUP_GIFT');
  text = groupGiftResult.cleaned;

  // Extract gift message (plain text, not JSON)
  let giftMessage: string | undefined;
  const gmOpen = text.indexOf('<GIFT_MESSAGE>');
  const gmClose = text.indexOf('</GIFT_MESSAGE>');
  if (gmOpen !== -1 && gmClose !== -1) {
    giftMessage = text.slice(gmOpen + '<GIFT_MESSAGE>'.length, gmClose).trim();
    text = (text.slice(0, gmOpen) + text.slice(gmClose + '</GIFT_MESSAGE>'.length)).trim();
  } else if (gmOpen !== -1) {
    // Streaming: tag opened but not closed yet
    text = text.slice(0, gmOpen).trim();
  }

  let checkoutForm = false;
  if (text.includes('<CHECKOUT_FORM/>') || text.includes('<CHECKOUT_FORM>')) {
    checkoutForm = true;
    text = text.replace(/<CHECKOUT_FORM\/?>.*?<\/?CHECKOUT_FORM>/g, '');
    text = text.replace(/<CHECKOUT_FORM\/?>/g, '');
  }

  let showCartSummary = false;
  if (text.includes('<CART_SUMMARY/>') || text.includes('<CART_SUMMARY>')) {
    showCartSummary = true;
    text = text.replace(/<CART_SUMMARY\/>/g, '').replace(/<CART_SUMMARY>/g, '');
  }

  // Clean excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  // Enforce human tone (remove generic patterns)
  text = enforceHumanTone(text);

  const result: ParsedResponse = { text, checkoutForm, showCartSummary };

  if (productsResult.data && Array.isArray(productsResult.data) && productsResult.data.length > 0) {
    result.products = productsResult.data;
  }

  if (comparisonResult.data && Array.isArray(comparisonResult.data) && comparisonResult.data.length > 0) {
    result.comparison = comparisonResult.data;
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

  if (tenSecondDecisionResult.data) {
    result.tenSecondDecision = tenSecondDecisionResult.data;
  }

  if (groupGiftResult.data) {
    result.groupGift = groupGiftResult.data;
  }

  if (giftMessage) {
    result.giftMessage = giftMessage;
  }

  return result;
}
