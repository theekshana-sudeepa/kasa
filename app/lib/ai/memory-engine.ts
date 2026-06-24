/**
 * KASA v4.0 — Conversation Memory Engine
 * 
 * Extracts and persists contextual information across the entire conversation.
 * Eliminates the #1 user frustration: "I already told you that!"
 * 
 * Tracks: delivery city, budget, occasion, gift target, preferences,
 * rejected products, mentioned names, and more.
 */

import type { ConversationMemory, CartItem } from '../mcp/types';

/**
 * Create a fresh empty memory
 */
export function createEmptyMemory(): ConversationMemory {
  return {
    deliveryCity: null,
    deliveryDate: null,
    budget: null,
    occasion: null,
    giftTarget: null,
    preferredCategories: [],
    rejectedProducts: [],
    mentionedNames: [],
    senderInfo: null,
    recipientInfo: null,
    lastSearchQueries: [],
    conversationTone: 'neutral',
  };
}

/**
 * Extract memory updates from a user message.
 * This is additive — it returns only the NEW information detected,
 * which gets merged into the existing memory.
 */
export function extractMemoryFromMessage(
  message: string,
  existingMemory: ConversationMemory,
  cart: CartItem[] = []
): Partial<ConversationMemory> {
  const lower = message.toLowerCase();
  const updates: Partial<ConversationMemory> = {};

  // ── City Detection ──
  const cityPatterns: Array<{ pattern: RegExp; city: string }> = [
    { pattern: /\b(colombo)\b/i, city: 'Colombo' },
    { pattern: /\b(kandy)\b/i, city: 'Kandy' },
    { pattern: /\b(galle)\b/i, city: 'Galle' },
    { pattern: /\b(negombo)\b/i, city: 'Negombo' },
    { pattern: /\b(jaffna)\b/i, city: 'Jaffna' },
    { pattern: /\b(matara)\b/i, city: 'Matara' },
    { pattern: /\b(kurunegala)\b/i, city: 'Kurunegala' },
    { pattern: /\b(anuradhapura)\b/i, city: 'Anuradhapura' },
    { pattern: /\b(batticaloa)\b/i, city: 'Batticaloa' },
    { pattern: /\b(trincomalee|trinco)\b/i, city: 'Trincomalee' },
    { pattern: /\b(nuwara eliya|nuwaraeliya)\b/i, city: 'Nuwara Eliya' },
    { pattern: /\b(ratnapura)\b/i, city: 'Ratnapura' },
    { pattern: /\b(badulla)\b/i, city: 'Badulla' },
    { pattern: /\b(hambantota)\b/i, city: 'Hambantota' },
    { pattern: /\b(kalutara)\b/i, city: 'Kalutara' },
    { pattern: /\b(panadura)\b/i, city: 'Panadura' },
    { pattern: /\b(moratuwa)\b/i, city: 'Moratuwa' },
    { pattern: /\b(dehiwala)\b/i, city: 'Dehiwala' },
    { pattern: /\b(kottawa)\b/i, city: 'Kottawa' },
    { pattern: /\b(maharagama)\b/i, city: 'Maharagama' },
  ];

  for (const cp of cityPatterns) {
    if (cp.pattern.test(lower) && !existingMemory.deliveryCity) {
      updates.deliveryCity = cp.city;
      break;
    }
  }

  // ── Date Detection ──
  const datePatterns: Array<{ pattern: RegExp; resolver: () => string }> = [
    {
      pattern: /\btomorrow\b/i,
      resolver: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
      },
    },
    {
      pattern: /\btoday\b/i,
      resolver: () => new Date().toISOString().split('T')[0],
    },
    {
      pattern: /\b(this weekend|saturday)\b/i,
      resolver: () => {
        const d = new Date();
        const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + daysUntilSat);
        return d.toISOString().split('T')[0];
      },
    },
    {
      pattern: /\b(202\d-\d{2}-\d{2})\b/,
      resolver: () => {
        const match = message.match(/\b(202\d-\d{2}-\d{2})\b/);
        return match ? match[1] : '';
      },
    },
  ];

  for (const dp of datePatterns) {
    if (dp.pattern.test(lower) && !existingMemory.deliveryDate) {
      const resolved = dp.resolver();
      if (resolved) {
        updates.deliveryDate = resolved;
        break;
      }
    }
  }

  // ── Budget Detection ──
  const budgetMatch =
    lower.match(/(?:under|below|max|budget|less than|within)\s*(?:rs\.?|lkr)?\s*([\d,]+)/i) ||
    lower.match(/(?:rs\.?|lkr)\s*([\d,]+)\s*(?:budget|max|or less)/i);
  if (budgetMatch && !existingMemory.budget) {
    updates.budget = {
      max: parseInt(budgetMatch[1].replace(/,/g, ''), 10),
      currency: 'LKR',
    };
  }

  // ── Occasion Detection ──
  const occasionPatterns: Array<{ pattern: RegExp; occasion: string }> = [
    { pattern: /\b(birthday|bday|b'day)\b/i, occasion: 'birthday' },
    { pattern: /\b(anniversary)\b/i, occasion: 'anniversary' },
    { pattern: /\b(wedding)\b/i, occasion: 'wedding' },
    { pattern: /\b(valentine|valentines)\b/i, occasion: 'valentines' },
    { pattern: /\b(christmas|xmas)\b/i, occasion: 'christmas' },
    { pattern: /\b(avurudu|new year)\b/i, occasion: 'avurudu' },
    { pattern: /\b(vesak)\b/i, occasion: 'vesak' },
    { pattern: /\b(graduation|convocation)\b/i, occasion: 'graduation' },
    { pattern: /\b(housewarming|new home)\b/i, occasion: 'housewarming' },
    { pattern: /\b(condolence|funeral|passed away|sympathy)\b/i, occasion: 'condolence' },
    { pattern: /\b(engagement|engaged)\b/i, occasion: 'engagement' },
    { pattern: /\b(farewell|goodbye|leaving)\b/i, occasion: 'farewell' },
    { pattern: /\b(get well|sick|hospital|recover)\b/i, occasion: 'get_well' },
    { pattern: /\b(baby shower|new baby|newborn)\b/i, occasion: 'baby_shower' },
    { pattern: /\b(retirement|retiring)\b/i, occasion: 'retirement' },
    { pattern: /\b(promotion|promoted)\b/i, occasion: 'promotion' },
    { pattern: /\b(apolog|sorry|forgive)\b/i, occasion: 'apology' },
    { pattern: /\b(thank|grateful|appreciat)\b/i, occasion: 'thank_you' },
  ];

  for (const op of occasionPatterns) {
    if (op.pattern.test(lower)) {
      updates.occasion = op.occasion;
      break;
    }
  }

  // ── Gift Target Detection ──
  const targetPatterns: Array<{ pattern: RegExp; target: string }> = [
    { pattern: /\b(amma|mom|mother|mum|mommy)\b/i, target: 'mother' },
    { pattern: /\b(thaththa|dad|father|daddy|papa)\b/i, target: 'father' },
    { pattern: /\b(wife|wifey)\b/i, target: 'wife' },
    { pattern: /\b(husband|hubby)\b/i, target: 'husband' },
    { pattern: /\b(girlfriend|gf)\b/i, target: 'girlfriend' },
    { pattern: /\b(boyfriend|bf)\b/i, target: 'boyfriend' },
    { pattern: /\b(friend|machang|buddy|bro|mate)\b/i, target: 'friend' },
    { pattern: /\b(boss|colleague|coworker)\b/i, target: 'colleague' },
    { pattern: /\b(sister|akka|nangi)\b/i, target: 'sister' },
    { pattern: /\b(brother|aiya|malli)\b/i, target: 'brother' },
    { pattern: /\b(teacher|guru)\b/i, target: 'teacher' },
    { pattern: /\bfor (my)?self\b|treat myself/i, target: 'self' },
  ];

  for (const tp of targetPatterns) {
    if (tp.pattern.test(lower)) {
      updates.giftTarget = tp.target;
      break;
    }
  }

  // ── Rejection Detection ──
  if (lower.match(/\b(no|nah|not that|something else|different|don't like|skip)\b/i)) {
    // If we just showed products and user says no, track rejection
    if (existingMemory.lastSearchQueries.length > 0) {
      updates.rejectedProducts = [
        ...existingMemory.rejectedProducts,
        ...existingMemory.lastSearchQueries,
      ];
    }
  }

  // ── Category Preference Detection ──
  const categoryKeywords: Array<{ pattern: RegExp; category: string }> = [
    { pattern: /\b(cake|bake|bakery)\b/i, category: 'cakes' },
    { pattern: /\b(flower|bouquet|rose|lily)\b/i, category: 'flowers' },
    { pattern: /\b(chocolate|choc)\b/i, category: 'chocolates' },
    { pattern: /\b(electronic|gadget|tech|phone|laptop)\b/i, category: 'electronics' },
    { pattern: /\b(grocer|food|rice|dal)\b/i, category: 'groceries' },
    { pattern: /\b(fashion|cloth|shirt|dress)\b/i, category: 'fashion' },
    { pattern: /\b(toy|game|play)\b/i, category: 'toys' },
    { pattern: /\b(jewel|gold|silver|ring|necklace)\b/i, category: 'jewelry' },
    { pattern: /\b(perfume|fragrance|cologne)\b/i, category: 'perfumes' },
    { pattern: /\b(hamper|basket|gift set)\b/i, category: 'hampers' },
  ];

  const newCategories: string[] = [];
  for (const ck of categoryKeywords) {
    if (ck.pattern.test(lower) && !existingMemory.preferredCategories.includes(ck.category)) {
      newCategories.push(ck.category);
    }
  }
  if (newCategories.length > 0) {
    updates.preferredCategories = [...existingMemory.preferredCategories, ...newCategories];
  }

  // ── Sender/Recipient Info from Checkout ──
  if (lower.includes('| sender:')) {
    const [recipPart, senderPart] = message.split('| Sender:');
    if (senderPart) {
      const sParts = senderPart.split(',').map((s) => s.trim());
      if (sParts.length >= 2) {
        updates.senderInfo = { name: sParts[0], email: sParts[1] };
      }
    }
  }

  // Detect "deliver to NAME, PHONE, ADDRESS" pattern
  const deliverToMatch = message.match(/deliver to\s+(.+)/i);
  if (deliverToMatch) {
    const details = deliverToMatch[1].replace(/\| Sender:.*/i, '').trim();
    const parts = details.split(',').map((s) => s.trim());
    const phoneIdx = parts.findIndex((p) => /\d{9,}/.test(p.replace(/[\s-]/g, '')));
    if (phoneIdx !== -1) {
      updates.recipientInfo = {
        name: phoneIdx > 0 ? parts[phoneIdx - 1] : parts[0],
        phone: parts[phoneIdx],
        address: parts.slice(phoneIdx + 1).join(', ') || 'Unknown',
      };
    }
  }

  return updates;
}

/**
 * Merge new updates into existing memory (non-destructive).
 */
export function mergeMemory(
  existing: ConversationMemory,
  updates: Partial<ConversationMemory>
): ConversationMemory {
  return {
    deliveryCity: updates.deliveryCity ?? existing.deliveryCity,
    deliveryDate: updates.deliveryDate ?? existing.deliveryDate,
    budget: updates.budget ?? existing.budget,
    occasion: updates.occasion ?? existing.occasion,
    giftTarget: updates.giftTarget ?? existing.giftTarget,
    preferredCategories: updates.preferredCategories ?? existing.preferredCategories,
    rejectedProducts: updates.rejectedProducts ?? existing.rejectedProducts,
    mentionedNames: updates.mentionedNames ?? existing.mentionedNames,
    senderInfo: updates.senderInfo ?? existing.senderInfo,
    recipientInfo: updates.recipientInfo ?? existing.recipientInfo,
    lastSearchQueries: updates.lastSearchQueries ?? existing.lastSearchQueries,
    conversationTone: updates.conversationTone ?? existing.conversationTone,
  };
}

/**
 * Format memory as a concise context block for the system prompt.
 */
export function formatMemoryForPrompt(memory: ConversationMemory): string {
  const parts: string[] = [];

  if (memory.deliveryCity) parts.push(`Delivery city: ${memory.deliveryCity}`);
  if (memory.deliveryDate) parts.push(`Delivery date: ${memory.deliveryDate}`);
  if (memory.budget) parts.push(`Budget: Under Rs. ${memory.budget.max.toLocaleString()}`);
  if (memory.occasion) parts.push(`Occasion: ${memory.occasion}`);
  if (memory.giftTarget) parts.push(`Gift for: ${memory.giftTarget}`);
  if (memory.preferredCategories.length > 0) {
    parts.push(`Interested in: ${memory.preferredCategories.join(', ')}`);
  }
  if (memory.rejectedProducts.length > 0) {
    parts.push(`Rejected/skipped: ${memory.rejectedProducts.slice(-3).join(', ')}`);
  }
  if (memory.recipientInfo) {
    parts.push(`Recipient: ${memory.recipientInfo.name} (${memory.recipientInfo.phone})`);
  }
  if (memory.senderInfo) {
    parts.push(`Sender: ${memory.senderInfo.name} (${memory.senderInfo.email})`);
  }

  if (parts.length === 0) return 'No prior context collected yet.';
  return parts.join('\n');
}
