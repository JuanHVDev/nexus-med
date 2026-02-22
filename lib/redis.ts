import { Redis } from "@upstash/redis"

const getRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  
  if (!url || !token) {
    return null
  }
  
  return new Redis({ url, token })
}

export const redis = getRedisClient()

export const CACHE_PREFIXES = {
  SESSION: "session:",
  RATE_LIMIT: "ratelimit:",
  DASHBOARD_STATS: "dashboard:stats:",
  CLINIC: "clinic:",
  USER_CLINIC: "user:clinic:",
} as const

export const CACHE_TTL = {
  DASHBOARD_STATS: 5 * 60,
  CLINIC: 30 * 60,
  USER_CLINIC: 30 * 60,
  SESSION: 60 * 60 * 24 * 7,
} as const

export async function getCached<T>(
  key: string
): Promise<T | null> {
  if (!redis) return null
  try {
    const cached = await redis.get<T>(key)
    return cached
  } catch (error) {
    console.error("Redis get error:", error)
    return null
  }
}

export async function setCached(
  key: string,
  value: unknown,
  ttl: number
): Promise<boolean> {
  if (!redis) return false
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttl })
    return true
  } catch (error) {
    console.error("Redis set error:", error)
    return false
  }
}

export async function deleteCached(key: string): Promise<boolean> {
  if (!redis) return false
  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.error("Redis delete error:", error)
    return false
  }
}

export async function deleteCachedByPattern(pattern: string): Promise<number> {
  if (!redis) return 0
  try {
    const keys = await redis.keys(pattern)
    if (keys.length === 0) return 0
    await redis.del(...keys)
    return keys.length
  } catch (error) {
    console.error("Redis delete by pattern error:", error)
    return 0
  }
}

export function createCacheKey(...parts: (string | number | bigint)[]): string {
  return parts.map(p => p.toString()).join(":")
}

export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args)
    const cached = await getCached<Awaited<ReturnType<T>>>(key)
    
    if (cached !== null) {
      return cached
    }
    
    const result = await fn(...args)
    
    if (result !== null && result !== undefined) {
      await setCached(key, result, ttl)
    }
    
    return result
  }) as T
}

export function isRedisConfigured(): boolean {
  return redis !== null
}
