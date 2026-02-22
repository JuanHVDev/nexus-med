import { cache } from "react"
import {
  getCached,
  setCached,
  deleteCached,
  deleteCachedByPattern,
  CACHE_PREFIXES,
  CACHE_TTL,
  createCacheKey,
  isRedisConfigured,
} from "./redis"

interface CacheOptions {
  ttl?: number
  prefix?: string
}

export function createCachedFunction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyBuilder: (...args: TArgs) => string,
  options: CacheOptions = {}
): (...args: TArgs) => Promise<TResult> {
  const { ttl = 300, prefix = "" } = options

  const cachedFn = async (...args: TArgs): Promise<TResult> => {
    if (!isRedisConfigured()) {
      return fn(...args)
    }

    const baseKey = keyBuilder(...args)
    const key = prefix ? `${prefix}${baseKey}` : baseKey

    const cached = await getCached<TResult>(key)
    if (cached !== null) {
      return cached
    }

    const result = await fn(...args)

    if (result !== null && result !== undefined) {
      await setCached(key, result, ttl)
    }

    return result
  }

  return cachedFn
}

export async function getCachedDashboardStats(
  clinicId: bigint
): Promise<{
  totalPatients: number
  appointmentsToday: number
  totalMedicalNotes: number
  monthlyRevenue: bigint
  pendingAppointments: number
} | null> {
  if (!isRedisConfigured()) return null
  
  const key = createCacheKey(CACHE_PREFIXES.DASHBOARD_STATS, clinicId.toString())
  const cached = await getCached<{
    totalPatients: number
    appointmentsToday: number
    totalMedicalNotes: number
    monthlyRevenue: string
    pendingAppointments: number
  }>(key)

  if (!cached) return null

  return {
    ...cached,
    monthlyRevenue: BigInt(cached.monthlyRevenue),
  }
}

export async function setCachedDashboardStats(
  clinicId: bigint,
  stats: {
    totalPatients: number
    appointmentsToday: number
    totalMedicalNotes: number
    monthlyRevenue: bigint
    pendingAppointments: number
  }
): Promise<void> {
  if (!isRedisConfigured()) return

  const key = createCacheKey(CACHE_PREFIXES.DASHBOARD_STATS, clinicId.toString())
  await setCached(
    key,
    {
      ...stats,
      monthlyRevenue: stats.monthlyRevenue.toString(),
    },
    CACHE_TTL.DASHBOARD_STATS
  )
}

export async function invalidateDashboardStats(clinicId: bigint): Promise<void> {
  if (!isRedisConfigured()) return
  
  const key = createCacheKey(CACHE_PREFIXES.DASHBOARD_STATS, clinicId.toString())
  await deleteCached(key)
}

export async function getCachedClinic(clinicId: bigint): Promise<unknown | null> {
  if (!isRedisConfigured()) return null
  
  const key = createCacheKey(CACHE_PREFIXES.CLINIC, clinicId.toString())
  return getCached(key)
}

export async function setCachedClinic(clinicId: bigint, data: unknown): Promise<void> {
  if (!isRedisConfigured()) return
  
  const key = createCacheKey(CACHE_PREFIXES.CLINIC, clinicId.toString())
  await setCached(key, data, CACHE_TTL.CLINIC)
}

export async function invalidateClinic(clinicId: bigint): Promise<void> {
  if (!isRedisConfigured()) return
  
  const key = createCacheKey(CACHE_PREFIXES.CLINIC, clinicId.toString())
  await deleteCached(key)
}

export async function getCachedUserClinic(userId: string): Promise<unknown | null> {
  if (!isRedisConfigured()) return null
  
  const key = createCacheKey(CACHE_PREFIXES.USER_CLINIC, userId)
  return getCached(key)
}

export async function setCachedUserClinic(userId: string, data: unknown): Promise<void> {
  if (!isRedisConfigured()) return
  
  const key = createCacheKey(CACHE_PREFIXES.USER_CLINIC, userId)
  await setCached(key, data, CACHE_TTL.USER_CLINIC)
}

export async function invalidateUserClinic(userId: string): Promise<void> {
  if (!isRedisConfigured()) return
  
  const key = createCacheKey(CACHE_PREFIXES.USER_CLINIC, userId)
  await deleteCached(key)
}

export async function invalidateAllClinicCache(clinicId: bigint): Promise<void> {
  if (!isRedisConfigured()) return

  await Promise.all([
    invalidateDashboardStats(clinicId),
    invalidateClinic(clinicId),
  ])

  await deleteCachedByPattern(`${CACHE_PREFIXES.USER_CLINIC}*`)
}

export const withRedisCache = cache(
  async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> => {
    if (isRedisConfigured()) {
      const cached = await getCached<T>(key)
      if (cached !== null) {
        return cached
      }
    }

    const result = await fetcher()

    if (isRedisConfigured() && result !== null && result !== undefined) {
      await setCached(key, result, ttl)
    }

    return result
  }
)
