/**
 * KASA v4.0 — Product Intelligence Ranker
 * 
 * Re-ranks products returned from MCP based on intelligent scoring:
 * - Budget fit (does the price match user's stated budget?)
 * - Occasion relevance (does the product name/category match the occasion?)
 * - Image quality (does it have a real image?)
 * - Name clarity (is the name descriptive and clean?)
 * - Stock confidence (is it in stock?)
 * 
 * Marks the top-scored product as "KASA's Pick" with a match reason.
 */

import type { Product, ConversationMemory } from '../mcp/types';

interface RankingContext {
  memory: ConversationMemory;
  searchQuery: string;
  isGiftMode: boolean;
}

interface ScoredProduct extends Product {
  _score: number;
  _reasons: string[];
}

/**
 * Score a single product based on context.
 */
function scoreProduct(product: Product, ctx: RankingContext): ScoredProduct {
  let score = 50; // Base score
  const reasons: string[] = [];

  // ── Budget Fit (0-30 points) ──
  if (ctx.memory.budget) {
    const budget = ctx.memory.budget.max;
    if (product.price <= budget) {
      // Under budget — bonus for being closer to budget (higher value for money)
      const budgetUtilization = product.price / budget;
      if (budgetUtilization >= 0.5 && budgetUtilization <= 0.9) {
        score += 30; // Sweet spot — good value without being too cheap
        reasons.push('Perfect price range for your budget');
      } else if (budgetUtilization > 0.9) {
        score += 20; // Near budget limit
        reasons.push('Premium choice within your budget');
      } else {
        score += 15; // Well under budget
        reasons.push('Budget-friendly option');
      }
    } else if (product.price <= budget * 1.15) {
      score += 5; // Slightly over budget — still mention it
      reasons.push('Slightly above budget but worth considering');
    } else {
      score -= 15; // Way over budget
    }
  } else {
    score += 10; // No budget constraint — neutral
  }

  // ── Occasion Relevance (0-25 points) ──
  if (ctx.memory.occasion) {
    const productLower = product.name.toLowerCase();
    const occasionKeywords: Record<string, string[]> = {
      birthday: ['birthday', 'cake', 'celebration', 'party', 'candle'],
      anniversary: ['anniversary', 'rose', 'premium', 'luxury', 'love'],
      wedding: ['wedding', 'gift', 'premium', 'hamper', 'set'],
      valentines: ['valentine', 'rose', 'red', 'heart', 'love', 'romantic'],
      apology: ['sorry', 'flower', 'bouquet', 'gift', 'special'],
      condolence: ['sympathy', 'white', 'wreath', 'lily'],
      baby_shower: ['baby', 'infant', 'newborn', 'toy'],
      graduation: ['graduation', 'gift', 'pen', 'watch'],
      thank_you: ['thank', 'gift', 'hamper', 'basket'],
      get_well: ['fruit', 'basket', 'health', 'juice'],
      promotion: ['celebration', 'premium', 'champagne', 'luxury'],
    };

    const relevantKeywords = occasionKeywords[ctx.memory.occasion] || [];
    const matches = relevantKeywords.filter((kw) => productLower.includes(kw));
    if (matches.length >= 2) {
      score += 25;
      reasons.push(`Great match for ${ctx.memory.occasion}`);
    } else if (matches.length === 1) {
      score += 15;
      reasons.push(`Suitable for ${ctx.memory.occasion}`);
    }
  }

  // ── Gift Target Relevance (0-10 points) ──
  if (ctx.memory.giftTarget && ctx.isGiftMode) {
    const targetGiftMap: Record<string, string[]> = {
      mother: ['flower', 'spa', 'saree', 'cake', 'hamper', 'kitchen'],
      father: ['gadget', 'watch', 'wallet', 'tool', 'pen', 'electronic'],
      wife: ['flower', 'jewel', 'perfume', 'spa', 'chocolate', 'rose'],
      husband: ['watch', 'gadget', 'cologne', 'wallet', 'electronic'],
      girlfriend: ['flower', 'chocolate', 'teddy', 'perfume', 'rose'],
      boyfriend: ['gadget', 'cologne', 'wallet', 'game'],
      friend: ['hamper', 'chocolate', 'fun', 'game', 'mug'],
      colleague: ['pen', 'notebook', 'hamper', 'desk', 'mug'],
      child: ['toy', 'game', 'puzzle', 'book', 'fun'],
    };

    const targetKeywords = targetGiftMap[ctx.memory.giftTarget] || [];
    const productLower = product.name.toLowerCase();
    if (targetKeywords.some((kw) => productLower.includes(kw))) {
      score += 10;
      reasons.push(`Popular choice for ${ctx.memory.giftTarget}`);
    }
  }

  // ── Image Quality (0-15 points) ──
  if (
    product.image_url &&
    !product.image_url.includes('placehold') &&
    !product.image_url.includes('placeholder') &&
    product.image_url.startsWith('http')
  ) {
    score += 15;
  } else {
    score -= 5; // No image penalty
  }

  // ── Name Clarity (0-10 points) ──
  if (product.name.length >= 10 && product.name.length <= 80) {
    score += 10; // Descriptive but not too long
  } else if (product.name.length < 10) {
    score += 3; // Too short — might be unclear
  } else {
    score += 5; // Too long — might be cluttered
  }

  // ── Stock Confidence (0-10 points) ──
  if (product.in_stock !== false) {
    score += 10;
  } else {
    score -= 20; // Out of stock is a major penalty
  }

  // ── Search Relevance (0-10 points) ──
  if (ctx.searchQuery) {
    const queryWords = ctx.searchQuery.toLowerCase().split(/\s+/);
    const nameWords = product.name.toLowerCase();
    const matchCount = queryWords.filter((w) => nameWords.includes(w)).length;
    score += Math.min(10, matchCount * 3);
    if (matchCount >= 2) {
      reasons.push('Strong search match');
    }
  }

  // ── Rejected Products Penalty ──
  if (ctx.memory.rejectedProducts.some((rp) => product.name.toLowerCase().includes(rp.toLowerCase()))) {
    score -= 30; // User already rejected similar items
  }

  return {
    ...product,
    _score: Math.max(0, Math.min(100, score)),
    _reasons: reasons,
  };
}

/**
 * Rank an array of products and mark the KASA Pick.
 * Returns the products in ranked order with kasaPick and matchReason set.
 */
export function rankProducts(
  products: Product[],
  context: RankingContext
): Product[] {
  if (!products || products.length === 0) return [];

  // Score all products
  const scored: ScoredProduct[] = products.map((p) => scoreProduct(p, context));

  // Sort by score descending
  scored.sort((a, b) => b._score - a._score);

  // Mark the top product as KASA Pick (only if it scored significantly higher)
  const topScore = scored[0]._score;
  const secondScore = scored.length > 1 ? scored[1]._score : 0;
  const shouldPickTop = topScore >= 60 && (topScore - secondScore >= 5 || scored.length === 1);

  return scored.map((p, idx) => {
    const result: Product = { ...p };
    delete (result as any)._score;
    delete (result as any)._reasons;

    if (idx === 0 && shouldPickTop) {
      result.kasaPick = true;
      result.matchReason =
        p._reasons.length > 0 ? p._reasons[0] : 'Best overall match';
      result.rankScore = p._score;
    }

    return result;
  });
}
