import { generateText } from 'ai';

/**
 * KASA Deep Intent Extractor
 * 
 * Uses AI to understand the REAL meaning behind user messages,
 * especially emotional/contextual ones like:
 *   "I broke up with my girlfriend… I need to send some flowers"
 *   "My amma's birthday is tomorrow and I completely forgot"
 *   "I want to apologize to my friend"
 * 
 * Extracts structured intent data for intelligent MCP routing
 * and emotionally-aware response generation.
 */

export interface ExtractedIntent {
  /** The user's emotional state */
  emotion: 'sad' | 'urgent' | 'excited' | 'anxious' | 'angry' | 'romantic' | 'grateful' | 'neutral';
  /** What they actually want to buy/do */
  shopping_intent: string;
  /** Optimized search queries for Kapruka MCP (1-3 queries) */
  search_queries: string[];
  /** Detected occasion */
  occasion: string;
  /** How KASA should respond */
  tone: 'empathetic' | 'excited' | 'practical' | 'urgent' | 'warm' | 'playful';
  /** Who the gift/item is for */
  gift_target: string;
  /** Whether this is a shopping intent at all */
  is_shopping: boolean;
  /** Original intent category for routing */
  intent_category: 'SEARCH' | 'GIFT' | 'CHECKOUT' | 'TRACK' | 'BROWSE' | 'URGENT' | 'CASUAL' | 'CLARIFY';
  /** Budget if mentioned */
  budget?: { max: number; currency: string };
  /** Delivery urgency */
  urgency: 'same_day' | 'next_day' | 'this_week' | 'no_rush' | 'unknown';
  // v4.0 additions
  /** Confidence score 0-1 on the extraction accuracy */
  confidence: number;
  /** UI mood signal mapped from emotion */
  mood: 'neutral' | 'warm' | 'excited' | 'urgent' | 'romantic' | 'calm';
  /** Whether the user is rejecting current suggestions */
  is_rejection: boolean;
  /** Whether this is a follow-up about a previously shown item */
  is_followup: boolean;
}

/**
 * Map emotional state to a UI mood for the MoodBackground component.
 */
export function emotionToMood(emotion: ExtractedIntent['emotion']): ExtractedIntent['mood'] {
  const moodMap: Record<string, ExtractedIntent['mood']> = {
    sad: 'warm',
    urgent: 'urgent',
    excited: 'excited',
    anxious: 'urgent',
    angry: 'warm',
    romantic: 'romantic',
    grateful: 'warm',
    neutral: 'neutral',
  };
  return moodMap[emotion] || 'neutral';
}

const INTENT_EXTRACTION_PROMPT = `You are KASA's Intent Intelligence Engine. Your job is to DEEPLY understand what a user really means and needs — especially when they express emotions, context, or vague desires.

CRITICAL: You must output ONLY valid JSON. No markdown, no explanation, no backticks. Just raw JSON.

Analyze the user's message and extract:

1. "emotion": Their emotional state. One of: sad, urgent, excited, anxious, angry, romantic, grateful, neutral
2. "shopping_intent": What they ACTUALLY want to buy. Be specific. E.g., "apology flowers with a card" not just "flowers"
3. "search_queries": Array of 1-3 optimized search terms for a Sri Lankan e-commerce site. Think like a search engine expert. Examples:
   - "I broke up with my girlfriend, need flowers" → ["rose bouquet", "apology flowers", "flower arrangement"]
   - "My amma's birthday tomorrow, forgot!" → ["birthday cake", "birthday flowers bouquet", "birthday gift hamper"]
   - "Need a phone charger" → ["phone charger", "USB cable"]
4. "occasion": The detected occasion. E.g., "breakup/apology", "birthday", "anniversary", "promotion", "condolence", "just because", "everyday shopping", "festival"
5. "tone": How the bot should respond. One of: empathetic, excited, practical, urgent, warm, playful
6. "gift_target": Who is it for? E.g., "girlfriend", "mother", "friend", "self", "colleague", "unknown"
7. "is_shopping": Boolean — does this message have ANY shopping/product intent?
8. "intent_category": One of: SEARCH, GIFT, CHECKOUT, TRACK, BROWSE, URGENT, CASUAL, CLARIFY
9. "budget": If mentioned, extract { "max": number, "currency": "LKR" }. Otherwise omit.
10. "urgency": One of: same_day, next_day, this_week, no_rush, unknown

CONTEXT CLUES TO USE:
- "forgot" + occasion = URGENT
- "broke up" / "angry" / "apologize" = empathetic + apology gifts
- "celebrating" / "promotion" / "got married" = excited + celebration gifts
- "amma" / "mom" / "mother" = gift for mother
- "machang" / "friend" / "bro" = gift for friend
- Price mentions like "under 5000" = budget constraint
- "today" / "tomorrow" / "ASAP" = urgency
- No emotional context + direct product ask = neutral, practical

EXAMPLES:
Message: "I broke up with my girlfriend… I need to send some flowers."
{"emotion":"sad","shopping_intent":"apology/reconciliation flowers for ex-girlfriend","search_queries":["rose bouquet","flower arrangement","sorry flowers"],"occasion":"breakup/apology","tone":"empathetic","gift_target":"girlfriend","is_shopping":true,"intent_category":"GIFT","urgency":"unknown"}

Message: "My amma's birthday is tomorrow and I completely forgot"
{"emotion":"anxious","shopping_intent":"last-minute birthday gift for mother","search_queries":["birthday cake","birthday flowers","birthday gift hamper"],"occasion":"birthday","tone":"urgent","gift_target":"mother","is_shopping":true,"intent_category":"URGENT","urgency":"same_day"}

Message: "I need a new phone charger"
{"emotion":"neutral","shopping_intent":"phone charger","search_queries":["phone charger","USB charger","mobile charger"],"occasion":"everyday shopping","tone":"practical","gift_target":"self","is_shopping":true,"intent_category":"SEARCH","urgency":"no_rush"}

Message: "hi there!"
{"emotion":"neutral","shopping_intent":"","search_queries":[],"occasion":"none","tone":"playful","gift_target":"unknown","is_shopping":false,"intent_category":"CASUAL","urgency":"unknown"}

Message: "I want to apologize to my friend, what should I send?"
{"emotion":"anxious","shopping_intent":"apology gift for friend","search_queries":["sorry gift","apology hamper","chocolate gift box"],"occasion":"apology","tone":"empathetic","gift_target":"friend","is_shopping":true,"intent_category":"GIFT","urgency":"unknown"}

Message: "track my order KAP12345"
{"emotion":"neutral","shopping_intent":"","search_queries":[],"occasion":"none","tone":"practical","gift_target":"unknown","is_shopping":false,"intent_category":"TRACK","urgency":"unknown"}

Message: "My wife is angry at me… need to fix this fast"
{"emotion":"anxious","shopping_intent":"make-up gift for angry wife","search_queries":["premium flower bouquet","chocolate gift","spa gift set"],"occasion":"apology","tone":"urgent","gift_target":"wife","is_shopping":true,"intent_category":"URGENT","urgency":"same_day"}

Message: "I'm celebrating my promotion! Need something special."
{"emotion":"excited","shopping_intent":"celebration treat for self","search_queries":["premium gift","celebration hamper","wine","luxury chocolate"],"occasion":"celebration/promotion","tone":"excited","gift_target":"self","is_shopping":true,"intent_category":"SEARCH","urgency":"no_rush"}

Now analyze the following message. Output ONLY the JSON object, nothing else.`;

/**
 * Extract deep intent from a user message using AI.
 * Falls back to heuristic extraction if AI fails.
 */
export async function extractIntent(
  model: Parameters<typeof generateText>[0]['model'],
  message: string,
  conversationContext?: string
): Promise<ExtractedIntent> {
  try {
    const contextHint = conversationContext
      ? `\nRecent conversation context: "${conversationContext.slice(0, 200)}"`
      : '';

    const result = await generateText({
      model,
      system: INTENT_EXTRACTION_PROMPT,
      prompt: `Message: "${message}"${contextHint}`,
      temperature: 0,
      maxOutputTokens: 500,
    });

    const rawText = result.text.trim();

    // Try to extract JSON from the response (handle markdown code blocks if AI wraps it)
    let jsonStr = rawText;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    const emotion = parsed.emotion || 'neutral';
    // Validate and return with defaults
    return {
      emotion,
      shopping_intent: parsed.shopping_intent || '',
      search_queries: Array.isArray(parsed.search_queries) ? parsed.search_queries.slice(0, 3) : [],
      occasion: parsed.occasion || 'none',
      tone: parsed.tone || 'practical',
      gift_target: parsed.gift_target || 'unknown',
      is_shopping: parsed.is_shopping ?? true,
      intent_category: parsed.intent_category || 'SEARCH',
      budget: parsed.budget || undefined,
      urgency: parsed.urgency || 'unknown',
      confidence: 0.85, // AI-extracted intents have high confidence
      mood: emotionToMood(emotion),
      is_rejection: /\b(no|nah|not that|something else|different|don't like|skip)\b/i.test(message),
      is_followup: /\b(first|second|third|that one|this one|tell me more|more about)\b/i.test(message),
    };
  } catch (err) {
    console.warn('[KASA Intent] AI extraction failed, using heuristic fallback:', err);
    return extractIntentFallback(message);
  }
}

/**
 * Heuristic-based intent extraction fallback.
 * Used when AI is unavailable or fails.
 * Much smarter than simple keyword matching — understands emotional patterns.
 */
export function extractIntentFallback(message: string): ExtractedIntent {
  const lower = message.toLowerCase();

  // --- Emotion Detection ---
  let emotion: ExtractedIntent['emotion'] = 'neutral';
  let tone: ExtractedIntent['tone'] = 'practical';
  let occasion = 'none';
  let gift_target = 'unknown';
  let urgency: ExtractedIntent['urgency'] = 'unknown';
  const search_queries: string[] = [];
  let shopping_intent = '';
  let is_shopping = false;
  let intent_category: ExtractedIntent['intent_category'] = 'CASUAL';

  // Emotional pattern detection
  const emotionalPatterns: Array<{
    pattern: RegExp;
    emotion: ExtractedIntent['emotion'];
    tone: ExtractedIntent['tone'];
    occasion: string;
    queries: string[];
    intent: string;
  }> = [
    {
      pattern: /broke up|breakup|break up|ex.?girlfriend|ex.?boyfriend|lost my (girl|boy)friend/i,
      emotion: 'sad',
      tone: 'empathetic',
      occasion: 'breakup/apology',
      queries: ['rose bouquet', 'apology flowers', 'flower arrangement'],
      intent: 'reconciliation/apology flowers',
    },
    {
      pattern: /apologize|apology|sorry|forgive|make.?up|angry at me|mad at me|fight with/i,
      emotion: 'anxious',
      tone: 'empathetic',
      occasion: 'apology',
      queries: ['sorry gift', 'apology hamper', 'flower bouquet', 'chocolate gift'],
      intent: 'apology gift',
    },
    {
      pattern: /forgot|completely forgot|last minute|emergency|panic/i,
      emotion: 'anxious',
      tone: 'urgent',
      occasion: 'forgotten occasion',
      queries: ['same day delivery gift', 'gift hamper', 'flowers and cake'],
      intent: 'last-minute gift',
    },
    {
      pattern: /birthday|bday|b'day/i,
      emotion: 'excited',
      tone: 'warm',
      occasion: 'birthday',
      queries: ['birthday cake', 'birthday flowers', 'birthday gift'],
      intent: 'birthday gift',
    },
    {
      pattern: /anniversary|wedding anniversary/i,
      emotion: 'romantic',
      tone: 'warm',
      occasion: 'anniversary',
      queries: ['anniversary gift', 'rose bouquet', 'anniversary cake'],
      intent: 'anniversary gift',
    },
    {
      pattern: /promot|celebrat|achieved|passed|graduated|success/i,
      emotion: 'excited',
      tone: 'excited',
      occasion: 'celebration',
      queries: ['celebration hamper', 'premium gift', 'wine', 'chocolate'],
      intent: 'celebration gift',
    },
    {
      pattern: /condolen|passed away|funeral|death|sympathy|bereave/i,
      emotion: 'sad',
      tone: 'empathetic',
      occasion: 'condolence',
      queries: ['sympathy flowers', 'white flowers', 'condolence wreath'],
      intent: 'condolence flowers',
    },
    {
      pattern: /wife.*(angry|mad|upset)|husband.*(angry|mad|upset)|(angry|mad|upset).*(wife|husband)/i,
      emotion: 'anxious',
      tone: 'urgent',
      occasion: 'apology',
      queries: ['premium flower bouquet', 'chocolate gift', 'spa gift set'],
      intent: 'make-up gift for spouse',
    },
    {
      pattern: /valentine|love|romantic|date night/i,
      emotion: 'romantic',
      tone: 'warm',
      occasion: 'romance',
      queries: ['red rose bouquet', 'valentine gift', 'chocolate and flowers'],
      intent: 'romantic gift',
    },
    {
      pattern: /thank|grateful|appreciat/i,
      emotion: 'grateful',
      tone: 'warm',
      occasion: 'thank you',
      queries: ['thank you gift', 'gift hamper', 'flowers'],
      intent: 'thank you gift',
    },
    {
      pattern: /new baby|baby shower|expecting|pregnant|newborn/i,
      emotion: 'excited',
      tone: 'excited',
      occasion: 'baby',
      queries: ['baby gift', 'baby hamper', 'newborn gift set'],
      intent: 'baby gift',
    },
    {
      pattern: /house.?warm|new home|new house|moving/i,
      emotion: 'excited',
      tone: 'warm',
      occasion: 'housewarming',
      queries: ['housewarming gift', 'home decor', 'gift hamper'],
      intent: 'housewarming gift',
    },
    // v4.0 — Expanded emotional patterns
    {
      pattern: /get well|sick|hospital|recover|surgery|unwell/i,
      emotion: 'sad',
      tone: 'empathetic',
      occasion: 'get well',
      queries: ['fruit basket', 'get well gift', 'health hamper'],
      intent: 'get well gift',
    },
    {
      pattern: /engag|proposal|ring|she said yes|he said yes/i,
      emotion: 'excited',
      tone: 'excited',
      occasion: 'engagement',
      queries: ['engagement gift', 'champagne', 'celebration hamper'],
      intent: 'engagement gift',
    },
    {
      pattern: /graduat|convocation|degree|passed exam/i,
      emotion: 'excited',
      tone: 'excited',
      occasion: 'graduation',
      queries: ['graduation gift', 'pen set', 'gift hamper'],
      intent: 'graduation gift',
    },
    {
      pattern: /farewell|goodbye|leaving|going abroad|migration/i,
      emotion: 'sad',
      tone: 'warm',
      occasion: 'farewell',
      queries: ['farewell gift', 'memory album', 'gift hamper'],
      intent: 'farewell gift',
    },
    {
      pattern: /retir|retiring|retirement/i,
      emotion: 'grateful',
      tone: 'warm',
      occasion: 'retirement',
      queries: ['retirement gift', 'premium gift', 'watch'],
      intent: 'retirement gift',
    },
    {
      pattern: /pongal|thai pongal/i,
      emotion: 'excited',
      tone: 'warm',
      occasion: 'pongal',
      queries: ['pongal gift', 'traditional sweets', 'rice cooker'],
      intent: 'pongal gift',
    },
  ];

  // Check emotional patterns
  for (const ep of emotionalPatterns) {
    if (ep.pattern.test(lower)) {
      emotion = ep.emotion;
      tone = ep.tone;
      occasion = ep.occasion;
      search_queries.push(...ep.queries);
      shopping_intent = ep.intent;
      is_shopping = true;
      intent_category = ep.emotion === 'anxious' || ep.emotion === 'sad' ? 'GIFT' : 'SEARCH';
      break;
    }
  }

  // Detect gift target
  const targetPatterns: Array<{ pattern: RegExp; target: string }> = [
    { pattern: /\b(amma|mom|mother|mum|mommy)\b/i, target: 'mother' },
    { pattern: /\b(thaththa|dad|father|daddy|papa)\b/i, target: 'father' },
    { pattern: /\b(wife|wifey)\b/i, target: 'wife' },
    { pattern: /\b(husband|hubby)\b/i, target: 'husband' },
    { pattern: /\b(girlfriend|gf|girl friend)\b/i, target: 'girlfriend' },
    { pattern: /\b(boyfriend|bf|boy friend)\b/i, target: 'boyfriend' },
    { pattern: /\b(friend|machang|buddy|bro|mate)\b/i, target: 'friend' },
    { pattern: /\b(boss|colleague|coworker|office)\b/i, target: 'colleague' },
    { pattern: /\b(sister|akka|nangi)\b/i, target: 'sister' },
    { pattern: /\b(brother|aiya|malli)\b/i, target: 'brother' },
    { pattern: /\b(grandma|grandmother|aachchi)\b/i, target: 'grandmother' },
    { pattern: /\b(grandpa|grandfather|seeya)\b/i, target: 'grandfather' },
    { pattern: /\b(baby|infant|toddler|child|kid)\b/i, target: 'child' },
    { pattern: /\b(teacher|guru)\b/i, target: 'teacher' },
    { pattern: /\bmy\s*self\b|for me|treat myself/i, target: 'self' },
  ];

  for (const tp of targetPatterns) {
    if (tp.pattern.test(lower)) {
      gift_target = tp.target;
      break;
    }
  }

  // Urgency detection
  if (/\b(today|asap|urgent|emergency|right now|immediately)\b/i.test(lower)) {
    urgency = 'same_day';
    if (emotion === 'neutral') emotion = 'urgent';
    if (tone === 'practical') tone = 'urgent';
  } else if (/\b(tomorrow|next day)\b/i.test(lower)) {
    urgency = 'next_day';
  } else if (/\b(this week|few days|soon)\b/i.test(lower)) {
    urgency = 'this_week';
  }

  // If urgency is detected but no emotional pattern was matched, mark as URGENT
  if (urgency === 'same_day' && intent_category === 'CASUAL') {
    intent_category = 'URGENT';
    is_shopping = true;
  }

  // Product keyword detection (if no emotional pattern matched)
  if (!is_shopping) {
    const productKeywords = [
      'show me', 'find', 'search', 'looking for', 'want', 'need',
      'gift', 'buy', 'cake', 'flower', 'chocolate', 'electronic',
      'grocer', 'toy', 'gadget', 'phone', 'wine', 'hamper',
      'fruit', 'baby', 'jewelry', 'perfume', 'sweet', 'clothing',
      'book', 'surprise', 'send',
    ];

    if (productKeywords.some(kw => lower.includes(kw))) {
      is_shopping = true;
      intent_category = 'SEARCH';

      // Extract search query from the message
      let query = message
        .replace(/^(show me|find me|search for|i want|i need|looking for|can you find|get me|i'm looking for|i am looking for)\s*/i, '')
        .replace(/\s*(please|thanks|thank you|pls)$/i, '')
        .trim();
      if (query.length < 2) query = message;

      if (search_queries.length === 0) {
        search_queries.push(query);
      }
      shopping_intent = query;
    }
  }

  // Check for non-shopping intents
  if (lower.match(/^(hi|hello|hey|good morning|good evening|good afternoon|howdy|sup|yo|ayubowan|vanakkam)/)) {
    intent_category = 'CASUAL';
    is_shopping = false;
  } else if (lower.match(/track|order status|where is my/)) {
    intent_category = 'TRACK';
    is_shopping = false;
  } else if (lower.match(/categor|browse|what do you have|what can/)) {
    intent_category = 'BROWSE';
  } else if (lower.match(/checkout|place order|buy now|confirm order/)) {
    intent_category = 'CHECKOUT';
  }

  // Budget extraction
  let budget: ExtractedIntent['budget'] | undefined;
  const budgetMatch = lower.match(/(?:under|below|max|budget|less than)\s*(?:rs\.?|lkr)?\s*([\d,]+)/i)
    || lower.match(/(?:rs\.?|lkr)\s*([\d,]+)\s*(?:budget|max|or less)/i);
  if (budgetMatch) {
    budget = {
      max: parseInt(budgetMatch[1].replace(/,/g, ''), 10),
      currency: 'LKR',
    };
  }

  // v4.0 — Rejection detection
  const is_rejection = /\b(no|nah|not that|something else|different|don't like|skip|another|other)\b/i.test(lower);

  // v4.0 — Follow-up detection
  const is_followup = /\b(first|second|third|that one|this one|tell me more|more about|more info|details about)\b/i.test(lower);

  // Calculate confidence based on how many signals matched
  const signalCount = [
    emotion !== 'neutral',
    is_shopping,
    search_queries.length > 0,
    occasion !== 'none',
    gift_target !== 'unknown',
    urgency !== 'unknown',
    budget !== undefined,
  ].filter(Boolean).length;
  const confidence = Math.min(1, 0.3 + signalCount * 0.1);

  return {
    emotion,
    shopping_intent,
    search_queries: search_queries.slice(0, 3),
    occasion,
    tone,
    gift_target,
    is_shopping,
    intent_category,
    budget,
    urgency,
    confidence,
    mood: emotionToMood(emotion),
    is_rejection,
    is_followup,
  };
}
