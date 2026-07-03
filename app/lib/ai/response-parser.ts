/**
 * KASA v4.0 — Response Parser
 * 
 * Parses AI responses to extract structured data from custom tags.
 * v4.0 adds: MOOD, SMART_SUGGESTIONS, KASA_PICK metadata in products.
 */

import type {
  Product,
  DeliveryInfo,
  OrderResult,
  TrackingInfo,
  CartItem,
  Category,
  SmartSuggestion,
  Mood,
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
  // v4.0
  mood?: Mood;
  smartSuggestions?: SmartSuggestion[];
}

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function extractTag<T>(text: string, tagName: string): { data: T | null; cleaned: string } {
  const openTag = `<${tagName}>`;
  const closeTag = `</${tagName}>`;
  
  let cleaned = text;
  let parsed: T | null = null;
  
  const lastCloseIdx = text.lastIndexOf(closeTag);
  
  if (lastCloseIdx !== -1) {
    const matchingOpenIdx = text.lastIndexOf(openTag, lastCloseIdx);
    
    if (matchingOpenIdx !== -1) {
      const rawContent = text.slice(matchingOpenIdx + openTag.length, lastCloseIdx).trim();
      const tryParse = safeParse<T>(rawContent);
      if (tryParse) {
        parsed = tryParse;
      }
    }
  }

  while(cleaned.includes(closeTag)) {
    const cIdx = cleaned.indexOf(closeTag);
    const oIdx = cleaned.lastIndexOf(openTag, cIdx);
    if (oIdx !== -1) {
      cleaned = cleaned.slice(0, oIdx) + cleaned.slice(cIdx + closeTag.length);
    } else {
      cleaned = cleaned.slice(0, cIdx) + cleaned.slice(cIdx + closeTag.length);
    }
  }
  
  while (cleaned.includes(openTag)) {
    const oIdx = cleaned.indexOf(openTag);
    cleaned = cleaned.slice(0, oIdx);
  }

  return { 
    data: parsed, 
    cleaned: cleaned.trim() 
  };
}

export function extractTextTag(text: string, tagName: string): { data: string | null; cleaned: string } {
  const openTag = `<${tagName}>`;
  const closeTag = `</${tagName}>`;
  
  let cleaned = text;
  let parsed: string | null = null;
  
  const lastCloseIdx = text.lastIndexOf(closeTag);
  
  if (lastCloseIdx !== -1) {
    const matchingOpenIdx = text.lastIndexOf(openTag, lastCloseIdx);
    
    if (matchingOpenIdx !== -1) {
      parsed = text.slice(matchingOpenIdx + openTag.length, lastCloseIdx).trim();
    }
  }

  while(cleaned.includes(closeTag)) {
    const cIdx = cleaned.indexOf(closeTag);
    const oIdx = cleaned.lastIndexOf(openTag, cIdx);
    if (oIdx !== -1) {
      cleaned = cleaned.slice(0, oIdx) + cleaned.slice(cIdx + closeTag.length);
    } else {
      cleaned = cleaned.slice(0, cIdx) + cleaned.slice(cIdx + closeTag.length);
    }
  }
  
  while (cleaned.includes(openTag)) {
    const oIdx = cleaned.indexOf(openTag);
    cleaned = cleaned.slice(0, oIdx);
  }

  return { 
    data: parsed, 
    cleaned: cleaned.trim() 
  };
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

  // v4.0 — Mood tag (simple text, not JSON)
  const moodResult = extractTextTag(text, 'MOOD');
  text = moodResult.cleaned;

  // v4.0 — Smart suggestions
  const smartSuggestionsResult = extractTag<SmartSuggestion[]>(text, 'SMART_SUGGESTIONS');
  text = smartSuggestionsResult.cleaned;

  // Extract gift message (plain text, not JSON)
  let giftMessage: string | undefined;
  const gmOpen = text.indexOf('<GIFT_MESSAGE>');
  const gmClose = text.indexOf('</GIFT_MESSAGE>');
  if (gmOpen !== -1 && gmClose !== -1) {
    giftMessage = text.slice(gmOpen + '<GIFT_MESSAGE>'.length, gmClose).trim();
    text = (text.slice(0, gmOpen) + text.slice(gmClose + '</GIFT_MESSAGE>'.length)).trim();
  } else if (gmOpen !== -1) {
    text = text.slice(0, gmOpen).trim();
  }

  let checkoutForm = false;
  if (text.includes('<CHECKOUT_FORM/>') || text.includes('<CHECKOUT_FORM>')) {
    checkoutForm = true;
    text = text.replace(/<CHECKOUT_FORM\/?>[^<]*<\/?CHECKOUT_FORM>/g, '');
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

  // v4.0 — Mood
  if (moodResult.data) {
    const validMoods = ['neutral', 'warm', 'excited', 'urgent', 'romantic', 'calm'];
    const moodLower = moodResult.data.toLowerCase() as Mood;
    if (validMoods.includes(moodLower)) {
      result.mood = moodLower;
    }
  }

  // v4.0 — Smart suggestions
  if (
    smartSuggestionsResult.data &&
    Array.isArray(smartSuggestionsResult.data) &&
    smartSuggestionsResult.data.length > 0
  ) {
    result.smartSuggestions = smartSuggestionsResult.data;
  }

  return result;
}
