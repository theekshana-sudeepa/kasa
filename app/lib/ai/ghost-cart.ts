/**
 * KASA v4.0 — Ghost Cart (Predictive Shopping)
 * 
 * While the user chats, KASA silently predicts what they'll add to cart
 * and pre-fetches product details, images, and delivery info.
 * When the user finally says "add to cart", the response is INSTANT.
 * 
 * This module is purely ephemeral — nothing persists beyond the session.
 */

import type { GhostCartItem, Product } from '../mcp/types';
import type { ExtractedIntent } from './intent-extractor';

// Session-scoped ghost cart storage
const ghostCarts = new Map<string, GhostCartItem[]>();

// Track in-flight predictions to prevent duplicates
const pendingPredictions = new Map<string, Set<string>>();

/**
 * Get the ghost cart for a session.
 */
export function getGhostCart(sessionId: string): GhostCartItem[] {
  return ghostCarts.get(sessionId) || [];
}

/**
 * Add predictions to the ghost cart.
 */
export function addToGhostCart(sessionId: string, items: GhostCartItem[]): void {
  const existing = ghostCarts.get(sessionId) || [];

  // Deduplicate by product_id
  const existingIds = new Set(existing.map((i) => i.product_id));
  const newItems = items.filter((i) => !existingIds.has(i.product_id));

  // Keep max 10 items in ghost cart
  const combined = [...existing, ...newItems].slice(-10);
  ghostCarts.set(sessionId, combined);
}

/**
 * Check if a product was already predicted (in ghost cart).
 * If it was, return the pre-fetched data.
 */
export function checkGhostCart(
  sessionId: string,
  productId: string
): GhostCartItem | undefined {
  const cart = ghostCarts.get(sessionId) || [];
  return cart.find((item) => item.product_id === productId);
}

/**
 * Remove an item from the ghost cart (e.g., after user actually adds it).
 */
export function removeFromGhostCart(sessionId: string, productId: string): void {
  const cart = ghostCarts.get(sessionId) || [];
  ghostCarts.set(
    sessionId,
    cart.filter((i) => i.product_id !== productId)
  );
}

/**
 * Clear the ghost cart for a session.
 */
export function clearGhostCart(sessionId: string): void {
  ghostCarts.delete(sessionId);
  pendingPredictions.delete(sessionId);
}

/**
 * Predict which products the user is likely to add to cart,
 * based on the current intent and shown products.
 * 
 * Returns product IDs to pre-fetch.
 */
export function predictLikelyAdditions(
  intent: ExtractedIntent,
  shownProducts: Product[],
  sessionId: string
): string[] {
  if (!shownProducts || shownProducts.length === 0) return [];

  // Get already-pending predictions to avoid duplicate fetches
  const pending = pendingPredictions.get(sessionId) || new Set<string>();
  const existing = ghostCarts.get(sessionId) || [];
  const existingIds = new Set(existing.map((i) => i.product_id));

  const predictions: string[] = [];

  // High confidence predictions based on intent
  if (intent.is_shopping) {
    // The top 2 most relevant products are likely additions
    for (let i = 0; i < Math.min(2, shownProducts.length); i++) {
      const p = shownProducts[i];
      if (!existingIds.has(p.product_id) && !pending.has(p.product_id)) {
        predictions.push(p.product_id);
        pending.add(p.product_id);
      }
    }

    // If user is in GIFT mode and products include flowers + cake,
    // predict they'll want the combo
    if (intent.intent_category === 'GIFT' || intent.intent_category === 'URGENT') {
      for (const p of shownProducts) {
        if (!existingIds.has(p.product_id) && !pending.has(p.product_id)) {
          const nameLower = p.name.toLowerCase();
          // Predict "complementary" items
          if (
            nameLower.includes('cake') ||
            nameLower.includes('flower') ||
            nameLower.includes('hamper')
          ) {
            predictions.push(p.product_id);
            pending.add(p.product_id);
          }
        }
      }
    }
  }

  pendingPredictions.set(sessionId, pending);
  return predictions.slice(0, 3); // Max 3 predictions to avoid over-fetching
}

/**
 * Convert MCP product data into a ghost cart item.
 */
export function createGhostCartItem(
  product: Product,
  confidence: number
): GhostCartItem {
  return {
    product_id: product.product_id,
    name: product.name,
    price: product.price,
    currency: product.currency || 'LKR',
    image_url: product.image_url,
    url: product.url,
    in_stock: product.in_stock,
    prediction_confidence: confidence,
    predicted_at: Date.now(),
  };
}

/**
 * Get ghost cart stats for telemetry/dashboard.
 */
export function getGhostCartStats(): {
  activeSessions: number;
  totalPredictions: number;
} {
  let totalPredictions = 0;
  ghostCarts.forEach((items) => {
    totalPredictions += items.length;
  });

  return {
    activeSessions: ghostCarts.size,
    totalPredictions,
  };
}

/**
 * Cleanup stale ghost carts (sessions older than 30 minutes).
 */
export function cleanupStaleGhostCarts(): number {
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  let cleaned = 0;

  ghostCarts.forEach((items, sessionId) => {
    const latestPrediction = Math.max(...items.map((i) => i.predicted_at), 0);
    if (latestPrediction < thirtyMinutesAgo) {
      ghostCarts.delete(sessionId);
      pendingPredictions.delete(sessionId);
      cleaned++;
    }
  });

  return cleaned;
}
