/**
 * Simple in-memory rate limiting for MVP
 * TODO: Replace with Redis or database-backed rate limiting for production
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (clears on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
}

const DEFAULT_OPTIONS: Required<RateLimitOptions> = {
  maxRequests: 20, // 20 requests per window (increased from 10)
  windowMs: 60 * 60 * 1000, // 1 hour window
};

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param options - Rate limit options
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or expired window - allow request
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + opts.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: opts.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Check if limit exceeded
  if (entry.count >= opts.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: opts.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Try various headers (for proxies, load balancers, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback (won't work in serverless, but good for development)
  return 'unknown';
}

