import { cache } from 'react'
import { prisma } from "@/lib/prisma"
import { isRedisConfigured, createCacheKey, CACHE_PREFIXES, CACHE_TTL, getCached, setCached, deleteCached } from "@/lib/redis"

interface UserClinicResult {
  clinicId: bigint
  role: string
  clinic: {
    id: bigint
    name: string
    rfc: string
    email: string | null
    phone: string | null
    address: string | null
    createdAt: Date
    updatedAt: Date
  }
}

async function fetchUserClinicFromDB(userId: string): Promise<UserClinicResult | null> {
  const userClinic = await prisma.userClinic.findFirst({
    where: { userId },
    include: {
      clinic: true,
    },
    orderBy: { joinedAt: 'asc' },
  })
  
  if (!userClinic) {
    return null
  }
  
  return {
    clinicId: userClinic.clinicId,
    role: userClinic.role,
    clinic: userClinic.clinic,
  }
}

async function fetchUserClinicIdFromDB(userId: string): Promise<bigint | null> {
  const userClinic = await prisma.userClinic.findFirst({
    where: { userId },
    select: { clinicId: true },
    orderBy: { joinedAt: 'asc' },
  })
  
  return userClinic?.clinicId ?? null
}

async function fetchUserRoleFromDB(userId: string): Promise<string | null> {
  const userClinic = await prisma.userClinic.findFirst({
    where: { userId },
    select: { role: true },
    orderBy: { joinedAt: 'asc' },
  })
  
  return userClinic?.role ?? null
}

export const getUserClinic = cache(async (userId: string): Promise<UserClinicResult | null> => {
  if (isRedisConfigured()) {
    const cacheKey = createCacheKey(CACHE_PREFIXES.USER_CLINIC, userId)
    const cached = await getCached<UserClinicResult>(cacheKey)
    if (cached) {
      return {
        ...cached,
        clinicId: BigInt(cached.clinicId),
        clinic: {
          ...cached.clinic,
          id: BigInt(cached.clinic.id),
        },
      }
    }
  }

  const result = await fetchUserClinicFromDB(userId)

  if (isRedisConfigured() && result) {
    const cacheKey = createCacheKey(CACHE_PREFIXES.USER_CLINIC, userId)
    await setCached(cacheKey, {
      ...result,
      clinicId: result.clinicId.toString(),
      clinic: {
        ...result.clinic,
        id: result.clinic.id.toString(),
      },
    }, CACHE_TTL.USER_CLINIC)
  }

  return result
})

export const getUserClinicId = cache(async (userId: string): Promise<bigint | null> => {
  if (isRedisConfigured()) {
    const cacheKey = createCacheKey(CACHE_PREFIXES.USER_CLINIC, userId, "id")
    const cached = await getCached<string>(cacheKey)
    if (cached) {
      return BigInt(cached)
    }
  }

  const result = await fetchUserClinicIdFromDB(userId)

  if (isRedisConfigured() && result) {
    const cacheKey = createCacheKey(CACHE_PREFIXES.USER_CLINIC, userId, "id")
    await setCached(cacheKey, result.toString(), CACHE_TTL.USER_CLINIC)
  }

  return result
})

export const getUserRole = cache(async (userId: string): Promise<string | null> => {
  if (isRedisConfigured()) {
    const cacheKey = createCacheKey(CACHE_PREFIXES.USER_CLINIC, userId, "role")
    const cached = await getCached<string>(cacheKey)
    if (cached) {
      return cached
    }
  }

  const result = await fetchUserRoleFromDB(userId)

  if (isRedisConfigured() && result) {
    const cacheKey = createCacheKey(CACHE_PREFIXES.USER_CLINIC, userId, "role")
    await setCached(cacheKey, result, CACHE_TTL.USER_CLINIC)
  }

  return result
})

export async function invalidateUserClinicCache(userId: string): Promise<void> {
  if (!isRedisConfigured()) return
  
  await Promise.all([
    deleteCached(createCacheKey(CACHE_PREFIXES.USER_CLINIC, userId)),
    deleteCached(createCacheKey(CACHE_PREFIXES.USER_CLINIC, userId, "id")),
    deleteCached(createCacheKey(CACHE_PREFIXES.USER_CLINIC, userId, "role")),
  ])
}
