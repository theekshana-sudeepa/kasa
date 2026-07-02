/**
 * Simple in-memory rate limiter for API routes.
 * Tracks request counts per IP with a sliding window.
 *
 * Usage in route handlers:
 *   const { limited } = checkRateLimit(request, { maxRequests: 20, windowMs: 60000 });
 *   if (limited) return new Response('Too many requests', { status: 429 });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 300_000);

interface RateLimitOptions {
  /** Maximum requests allowed in the window (default: 30) */
  maxRequests?: number;
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number;
}

/**
 * Check if a request is rate-limited.
 * Returns { limited: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  request: Request,
  options: RateLimitOptions = {}
): { limited: boolean; remaining: number; resetAt: number } {
  const { maxRequests = 30, windowMs = 60_000 } = options;

  // Extract client identifier
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'anonymous';
  const key = `${ip}:${new URL(request.url).pathname}`;

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return { limited: true, remaining: 0, resetAt: entry.resetAt };
  }

  return { limited: false, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Sanitize user input by stripping dangerous patterns.
 * Prevents XSS and injection via chat messages.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    // Strip script injection patterns
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Limit length
    .slice(0, 2000)
    .trim();
}

/**
 * Create a 429 Too Many Requests response with Retry-After header.
 */
export function rateLimitResponse(resetAt: number): Response {
  const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please slow down!',
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Reset': new Date(resetAt).toISOString(),
      },
    }
  );
}
