import { getRedis } from "./redis";

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super(`Rate limit exceeded, retry after ${retryAfterSeconds}s`);
  }
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  try {
    const redis = getRedis();
    const redisKey = `ratelimit:${key}`;
    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    if (count > limit) {
      const ttl = await redis.ttl(redisKey);
      throw new RateLimitError(ttl > 0 ? ttl : windowSeconds);
    }
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    console.error("[rate-limit] Redis unavailable, failing open:", error);
  }
}

export function rateLimitKeyForIp(request: Request, route: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return `${route}:${ip}`;
}