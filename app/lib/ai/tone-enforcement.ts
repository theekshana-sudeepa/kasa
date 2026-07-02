/**
 * KASA v4.0 — Tone Enforcement v2
 *
 * Now with AUTO-FIX — doesn't just detect robotic patterns, actively replaces them.
 * Also enforces response length limits and prevents duplicate suggestions.
 */

const ROBOTIC_PATTERNS = [
  // Generic openings
  /^(I'd be happy|I'm happy|I'll be happy|I would be happy)/i,
  /^(Here are|Here is|Here's the)/i,
  /^(Please choose|Please select|Please let me)/i,
  /^(Great question|Excellent question|Thanks for asking)/i,
  /^(Based on your request|According to|In response to)/i,

  // Generic closings
  /(Hope this helps|Let me know if|Feel free to|If you have any)/i,
  /(Thank you for|Thanks for asking)/i,

  // Overly formal patterns
  /^(Certainly|Indeed|Precisely|Quite|Exactly)/i,

  // List-heavy patterns (should be conversational)
  /^(\d\.|^-|^•)[\s\S]{0,30}(\d\.|^-|^•)[\s\S]{0,30}(\d\.|^-|^•)/m,

  // Wall-of-text detection (4+ lines of same topic)
  /(.+\n){4,}(?!```)/,
];

const HUMAN_SIGNALS = [
  // Contractions show conversational tone
  /don't|won't|can't|it's|that's|here's|let's/i,
  // Conversational starters
  /^(So|Actually|Hmm|Well|Look|Okay|Right|Sure)/i,
  // Direct recommendations (not just options)
  /My (honest )?pick|I'd go with|Trust me|Here's why/i,
  // Personality
  /😄|😊|💔|🎂|✨|👍/,
  // Cultural references (places/events, NOT kinship terms)
  /Sri Lanka|Sri Lankan|Colombo|fest|Avurudu|Vesak|Poson/i,
];

// ── Auto-fix replacements ──
const REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /^I'd be happy to help you with/i, replacement: "Let me help you with" },
  { pattern: /^Here are the results for your search/i, replacement: "Found these for you" },
  { pattern: /^Here are (\d+) great/i, replacement: "Check out these" },
  { pattern: /^Here are some /i, replacement: "Check out these " },
  { pattern: /^Here is a /i, replacement: "Got a " },
  { pattern: /^Here's what I found/i, replacement: "Found some great options" },
  { pattern: /^Certainly!/i, replacement: "Sure!" },
  { pattern: /^Indeed,/i, replacement: "Yeah," },
  { pattern: /^I can help you with that!/i, replacement: "On it!" },
  { pattern: /^Great question!/i, replacement: "" },
  { pattern: /^Excellent choice!/i, replacement: "Good taste!" },
  { pattern: /^Based on your requirements,/i, replacement: "Given what you need," },
  { pattern: /^Based on your request,/i, replacement: "" },
  { pattern: /^In response to your query,/i, replacement: "" },
  { pattern: /^Thank you for your patience\./i, replacement: "" },
  // Trailing robotic patterns
  { pattern: /\. Hope this helps!?$/i, replacement: "." },
  { pattern: /\. Let me know if you need anything else!?$/i, replacement: "." },
  { pattern: /\. Feel free to ask if you have any (?:more |other )?questions!?$/i, replacement: "." },
  { pattern: /\. If you have any (?:more |other )?questions.*$/i, replacement: "." },
  { pattern: /\. Is there anything else I can help you with\??$/i, replacement: "." },
];

export function analyzeResponseTone(response: string): {
  isRobotic: boolean;
  roboticPatterns: string[];
  humanScore: number;
  warnings: string[];
} {
  const roboticMatches = ROBOTIC_PATTERNS
    .map((pattern) => (pattern.test(response) ? pattern.toString() : null))
    .filter(Boolean) as string[];

  const humanMatches = HUMAN_SIGNALS
    .map((signal) => (signal.test(response) ? 1 : 0) as number)
    .reduce((a, b) => a + b, 0);

  const warnings: string[] = [];

  if (roboticMatches.length > 0) {
    warnings.push(`Robotic pattern detected: ${roboticMatches[0]}`);
  }

  if (response.split('\n').length > 10) {
    warnings.push('Response too long (wall-of-text). Max 10 lines recommended.');
  }

  // Count emoji
  const emojiCount = (response.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 2) {
    warnings.push(`Too many emoji (${emojiCount}). Max 2 recommended.`);
  }

  return {
    isRobotic: roboticMatches.length > 2,
    roboticPatterns: roboticMatches,
    humanScore: humanMatches,
    warnings,
  };
}

/**
 * Enforce human tone — actively replaces robotic patterns.
 */
export function enforceHumanTone(response: string): string {
  let result = response;

  // Apply all auto-fix replacements
  for (const { pattern, replacement } of REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  // Clean up empty leading lines
  result = result.replace(/^\s*\n+/, '');

  // Remove consecutive identical sentences
  const sentences = result.split(/(?<=[.!?])\s+/);
  const uniqueSentences: string[] = [];
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed && !uniqueSentences.includes(trimmed)) {
      uniqueSentences.push(trimmed);
    }
  }
  result = uniqueSentences.join(' ');

  return result.trim();
}

/**
 * Check for duplicate suggestions in consecutive messages.
 */
export function deduplicateSuggestions(
  currentSuggestions: string[],
  previousSuggestions: string[]
): string[] {
  const prevSet = new Set(previousSuggestions.map((s) => s.toLowerCase()));
  return currentSuggestions.filter((s) => !prevSet.has(s.toLowerCase()));
}
