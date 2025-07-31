import { NextRequest, NextResponse } from "next/server";

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = {},
): Promise<NextResponse | null> {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  } = options;

  // Get client IP
  const clientIP =
    request.ip ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const key = `rate_limit:${clientIP}`;
  const now = Date.now();

  // Clean up expired entries
  for (const [storeKey, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(storeKey);
    }
  }

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return null;
  }

  if (record.count >= maxRequests) {
    // Rate limit exceeded
    const resetTime = new Date(record.resetTime);
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    const response = NextResponse.json(
      {
        success: false,
        message: "Too many requests. Please try again later.",
        retryAfter,
      },
      { status: 429 },
    );

    response.headers.set("X-RateLimit-Limit", maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", "0");
    response.headers.set("X-RateLimit-Reset", resetTime.toISOString());
    response.headers.set("Retry-After", retryAfter.toString());

    return response;
  }

  // Increment counter
  record.count++;
  rateLimitStore.set(key, record);

  return null;
}

export function getRemainingRequests(
  clientIP: string,
  maxRequests: number = 100,
): number {
  const key = `rate_limit:${clientIP}`;
  const record = rateLimitStore.get(key);

  if (!record || Date.now() > record.resetTime) {
    return maxRequests;
  }

  return Math.max(0, maxRequests - record.count);
}
