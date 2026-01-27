/**
 * Simple in-memory rate limiter
 * Prevents spam/abuse of AI endpoints
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Cleanup old records every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request is allowed
   */
  checkLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const record = this.records.get(identifier);

    // No record or expired - allow
    if (!record || now > record.resetAt) {
      const newRecord: RateLimitRecord = {
        count: 1,
        resetAt: now + this.windowMs,
      };
      this.records.set(identifier, newRecord);

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: newRecord.resetAt,
      };
    }

    // Increment count
    record.count++;
    this.records.set(identifier, record);

    // Check if over limit
    if (record.count > this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
      };
    }

    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetAt: record.resetAt,
    };
  }

  /**
   * Clean up expired records
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now > record.resetAt) {
        this.records.delete(key);
      }
    }
  }
}

// Global rate limiters for different AI endpoints
const quizRateLimiter = new RateLimiter(5, 60000); // 5 requests per minute
const generalRateLimiter = new RateLimiter(20, 60000); // 20 requests per minute

/**
 * Extract identifier from request (IP or user ID)
 */
export function getRequestIdentifier(request: Request): string {
  // Try to get IP from headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  // Could also use session/user ID if authenticated
  // For now, use IP
  return ip;
}

/**
 * Check rate limit for quiz endpoint
 */
export function checkQuizRateLimit(identifier: string) {
  return quizRateLimiter.checkLimit(identifier);
}

/**
 * Check rate limit for general AI endpoints
 */
export function checkGeneralRateLimit(identifier: string) {
  return generalRateLimiter.checkLimit(identifier);
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(resetAt: number) {
  const resetIn = Math.ceil((resetAt - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: "Too many requests",
      error_fr: "Trop de requêtes",
      message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
      message_fr: `Limite de débit dépassée. Réessaie dans ${resetIn} secondes.`,
      resetAt,
      resetIn,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(resetIn),
      },
    }
  );
}
