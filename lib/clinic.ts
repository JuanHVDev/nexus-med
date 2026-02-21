import { cache } from 'react'
import { prisma } from "@/lib/prisma"

export const getUserClinic = cache(async (userId: string) => {
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
})

export const getUserClinicId = cache(async (userId: string): Promise<bigint | null> => {
  const userClinic = await prisma.userClinic.findFirst({
    where: { userId },
    select: { clinicId: true },
    orderBy: { joinedAt: 'asc' },
  })
  
  return userClinic?.clinicId ?? null
})

export const getUserRole = cache(async (userId: string): Promise<string | null> => {
  const userClinic = await prisma.userClinic.findFirst({
    where: { userId },
    select: { role: true },
    orderBy: { joinedAt: 'asc' },
  })
  
  return userClinic?.role ?? null
})
