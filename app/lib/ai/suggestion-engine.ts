/**
 * KASA v4.0 — Smart Suggestion Engine
 * 
 * Generates hyper-relevant next-best-action suggestions based on:
 * - What just happened in the conversation (response type)
 * - Cart state (items, total, empty?)
 * - Time of day & day of week
 * - Festival context
 * - Conversation memory (occasion, budget, preferences)
 * 
 * Replaces the static quick reply system with dynamic intelligence.
 */

import type { SmartSuggestion, CartItem, ConversationMemory } from '../mcp/types';
import { getFestivalContext } from './system-prompt';

type ResponseType =
  | 'products_shown'
  | 'order_placed'
  | 'order_confirmed'
  | 'tracking_shown'
  | 'delivery_checked'
  | 'checkout_form'
  | 'categories_shown'
  | 'greeting'
  | 'error'
  | 'comparison'
  | 'gift_message'
  | 'empty_results'
  | 'general';

interface SuggestionContext {
  responseType: ResponseType;
  cart: CartItem[];
  memory: ConversationMemory;
  lastProductNames?: string[];
  messageCount: number;
}

/**
 * Generate 3-4 smart, context-aware suggestions.
 */
export function generateSmartSuggestions(ctx: SuggestionContext): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  const hour = new Date().getHours();
  const hasCart = ctx.cart.length > 0;
  const cartTotal = ctx.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const festival = getFestivalContext();

  switch (ctx.responseType) {
    case 'products_shown': {
      // User just saw products — suggest actions on those products
      suggestions.push({ text: 'Compare these', emoji: '⚖️', type: 'action' });

      if (ctx.lastProductNames && ctx.lastProductNames.length > 0) {
        const firstName = ctx.lastProductNames[0];
        const shortName = firstName.length > 25 ? firstName.slice(0, 25) + '…' : firstName;
        suggestions.push({ text: `More about "${shortName}"`, emoji: '🔍', type: 'search' });
      }

      suggestions.push({ text: 'Show me cheaper options', emoji: '💰', type: 'search' });

      if (hasCart) {
        suggestions.push({ text: 'Ready to checkout', emoji: '✅', type: 'action' });
      } else {
        suggestions.push({ text: 'Show me something else', emoji: '🔄', type: 'search' });
      }
      break;
    }

    case 'order_placed':
    case 'order_confirmed': {
      suggestions.push({ text: 'Track this order', emoji: '📦', type: 'action' });
      suggestions.push({ text: 'Shop for someone else', emoji: '🎁', type: 'search' });
      suggestions.push({ text: 'Browse trending items', emoji: '🔥', type: 'navigate' });
      break;
    }

    case 'tracking_shown': {
      suggestions.push({ text: 'Track another order', emoji: '📦', type: 'action' });
      suggestions.push({ text: 'Continue shopping', emoji: '🛒', type: 'navigate' });
      suggestions.push({ text: 'Browse gifts', emoji: '🎁', type: 'search' });
      break;
    }

    case 'categories_shown': {
      suggestions.push({ text: 'Show me cakes', emoji: '🎂', type: 'search' });
      suggestions.push({ text: 'Show me flowers', emoji: '💐', type: 'search' });
      suggestions.push({ text: 'Show me electronics', emoji: '📱', type: 'search' });
      suggestions.push({ text: 'Gift ideas', emoji: '🎁', type: 'search' });
      break;
    }

    case 'checkout_form':
    case 'delivery_checked': {
      if (!ctx.memory.deliveryCity) {
        suggestions.push({ text: 'Colombo', emoji: '📍', type: 'action' });
        suggestions.push({ text: 'Kandy', emoji: '📍', type: 'action' });
        suggestions.push({ text: 'Galle', emoji: '📍', type: 'action' });
      } else if (!ctx.memory.deliveryDate) {
        suggestions.push({ text: 'Tomorrow', emoji: '📅', type: 'action' });
        suggestions.push({ text: 'This weekend', emoji: '📅', type: 'action' });
        suggestions.push({ text: 'As soon as possible', emoji: '⚡', type: 'action' });
      }
      break;
    }

    case 'comparison': {
      suggestions.push({ text: 'I\'ll go with the cheapest', emoji: '💰', type: 'action' });
      suggestions.push({ text: 'Which do you recommend?', emoji: '🤔', type: 'action' });
      suggestions.push({ text: 'Show me different options', emoji: '🔄', type: 'search' });
      break;
    }

    case 'gift_message': {
      suggestions.push({ text: 'Perfect, use this message', emoji: '✅', type: 'action' });
      suggestions.push({ text: 'Make it more personal', emoji: '✏️', type: 'action' });
      suggestions.push({ text: 'Skip the message', emoji: '⏭️', type: 'action' });
      break;
    }

    case 'empty_results': {
      suggestions.push({ text: 'Try a different search', emoji: '🔍', type: 'search' });
      suggestions.push({ text: 'Browse categories', emoji: '📂', type: 'navigate' });
      suggestions.push({ text: 'Show me popular items', emoji: '🔥', type: 'search' });
      suggestions.push({ text: 'Gift ideas', emoji: '🎁', type: 'search' });
      break;
    }

    case 'greeting': {
      // Smart greeting suggestions based on time and context
      if (festival) {
        suggestions.push({ text: 'Festival gifts', emoji: '🎊', type: 'search' });
      }

      if (hour < 10) {
        suggestions.push({ text: 'Morning essentials', emoji: '☀️', type: 'search' });
      } else if (hour >= 21) {
        suggestions.push({ text: 'Late night deals', emoji: '🌙', type: 'search' });
      }

      suggestions.push({ text: 'Birthday gift ideas', emoji: '🎂', type: 'search' });
      suggestions.push({ text: 'Browse categories', emoji: '📂', type: 'navigate' });

      if (suggestions.length < 4) {
        suggestions.push({ text: 'Surprise me!', emoji: '🎲', type: 'search' });
      }
      break;
    }

    case 'error': {
      suggestions.push({ text: 'Try again', emoji: '🔄', type: 'action' });
      suggestions.push({ text: 'Browse categories', emoji: '📂', type: 'navigate' });
      suggestions.push({ text: 'Show me gifts', emoji: '🎁', type: 'search' });
      break;
    }

    default: {
      // Contextual defaults based on conversation state
      if (hasCart && cartTotal > 0) {
        suggestions.push({ text: `Checkout (Rs. ${cartTotal.toLocaleString()})`, emoji: '✅', type: 'action' });
      }

      // Occasion-aware suggestions
      if (ctx.memory.occasion === 'birthday' && !ctx.memory.preferredCategories.includes('cakes')) {
        suggestions.push({ text: 'Add a birthday cake?', emoji: '🎂', type: 'search' });
      }
      if (ctx.memory.occasion === 'birthday' && !ctx.memory.preferredCategories.includes('flowers')) {
        suggestions.push({ text: 'Add flowers?', emoji: '💐', type: 'search' });
      }

      // Fill remaining slots
      if (suggestions.length < 3) {
        suggestions.push({ text: 'Browse categories', emoji: '📂', type: 'navigate' });
      }
      if (suggestions.length < 4) {
        suggestions.push({ text: 'Track my order', emoji: '📦', type: 'action' });
      }
      break;
    }
  }

  // Ensure we never return more than 4
  return suggestions.slice(0, 4);
}

/**
 * Detect response type from the parsed response content for suggestion generation.
 */
export function detectResponseType(parsedText: string, hasProducts: boolean): ResponseType {
  if (hasProducts) return 'products_shown';
  if (parsedText.includes('<ORDER>')) return 'order_confirmed';
  if (parsedText.includes('<TRACKING>')) return 'tracking_shown';
  if (parsedText.includes('<DELIVERY>')) return 'delivery_checked';
  if (parsedText.includes('<CHECKOUT_FORM')) return 'checkout_form';
  if (parsedText.includes('<CATEGORIES>')) return 'categories_shown';
  if (parsedText.includes('<COMPARISON>')) return 'comparison';
  if (parsedText.includes('<GIFT_MESSAGE>')) return 'gift_message';
  if (parsedText.includes('couldn\'t find') || parsedText.includes('no results')) return 'empty_results';
  if (parsedText.includes('error') || parsedText.includes('went wrong')) return 'error';
  return 'general';
}
