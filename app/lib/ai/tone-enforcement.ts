/**
 * TONE ENFORCEMENT LAYER
 *
 * Scans AI responses for robotic patterns and flags them for
 * developer review. Ensures KASA always feels human, warm, and conversational.
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
  /Aiyo/i,
  /machang/i,
  /aiya/i,
  /amma/i,
  /anna/i,
  /punchi/i,
  // Contractions show conversational tone
  /don't|won't|can't|it's|that's|here's|let's/i,
  // Conversational starters
  /^(So|Actually|Hmm|Well|Look)/i,
  // Direct recommendations (not just options)
  /My (honest )?pick|I'd go with|Trust me|Here's why/i,
  // Personality
  /😄|😊|💔|🎂|✨|👍/,
  // Cultural references
  /Sri Lanka|Sri Lankan|Colombo|fest|Avurudu|Vesak|Poson/i,
];

export function analyzeResponseTone(response: string): {
  isRobotic: boolean;
  roboticPatterns: string[];
  humanScore: number;
  warnings: string[];
} {
  const roboticMatches = ROBOTIC_PATTERNS
    .map((pattern, idx) => pattern.test(response) ? pattern.toString() : null)
    .filter(Boolean) as string[];

  const humanMatches = HUMAN_SIGNALS
    .map((signal) => signal.test(response) ? 1 : 0)
    .reduce((a, b) => a + b, 0);

  const warnings: string[] = [];

  if (roboticMatches.length > 0) {
    warnings.push(`Robotic pattern detected: ${roboticMatches[0]}`);
  }

  if (response.split('\n').length > 10) {
    warnings.push('Response too long (wall-of-text). Max 10 lines recommended.');
  }

  // Count emoji
  const emojiCount = (response.match(/[😀-🙏🎁🎂🌹💐💐💔✨]/g) || []).length;
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

export function enforceHumanTone(response: string): string {
  let result = response;

  // Replace generic openings
  result = result.replace(
    /^I'd be happy to help you with/i,
    "Let me help you with"
  );
  result = result.replace(
    /^Here are the results for your search/i,
    "Found these for you"
  );
  result = result.replace(
    /^Here are (\d+) great/i,
    "Check out these"
  );

  return result;
}
