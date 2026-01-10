import { LRUCache } from "lru-cache";

/**
 * Rate Limiter using LRU Cache
 * Implements sliding window rate limiting for DDoS protection
 * Follows Single Responsibility Principle (SRP)
 */

interface RateLimitOptions {
  /** Maximum number of requests per interval */
  limit: number;
  /** Time window in milliseconds */
  interval: number;
  /** Maximum unique tokens to track */
  uniqueTokensPerInterval?: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Creates a rate limiter instance
 * @param options - Rate limit configuration
 * @returns Rate limiter with check function
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { limit, interval, uniqueTokensPerInterval = 500 } = options;

  const tokenCache = new LRUCache<string, number[]>({
    max: uniqueTokensPerInterval,
    ttl: interval,
  });

  return {
    /**
     * Check if request should be rate limited
     * @param token - Unique identifier (IP, user ID, etc.)
     * @returns Rate limit result with remaining count
     */
    check: async (token: string): Promise<RateLimitResult> => {
      const now = Date.now();
      const windowStart = now - interval;

      // Get existing timestamps for this token
      const timestamps = tokenCache.get(token) ?? [];

      // Filter timestamps within current window
      const validTimestamps = timestamps.filter((ts) => ts > windowStart);

      // Add current request timestamp
      validTimestamps.push(now);
      tokenCache.set(token, validTimestamps);

      const currentCount = validTimestamps.length;
      const remaining = Math.max(0, limit - currentCount);
      const reset = Math.ceil((windowStart + interval) / 1000);

      return {
        success: currentCount <= limit,
        limit,
        remaining,
        reset,
      };
    },
  };
}

// Pre-configured rate limiters for different use cases
export const authRateLimiter = createRateLimiter({
  limit: 5, // 5 attempts
  interval: 60 * 1000, // per minute
});

export const apiRateLimiter = createRateLimiter({
  limit: 100, // 100 requests
  interval: 60 * 1000, // per minute
});

export const contactFormRateLimiter = createRateLimiter({
  limit: 3, // 3 submissions
  interval: 60 * 60 * 1000, // per hour
});

/**
 * Get client IP from request headers
 * Works with Vercel, Cloudflare, and standard proxies
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("cf-connecting-ip") ??
    "anonymous"
  );
}

/**
 * Rate limit response headers
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}
