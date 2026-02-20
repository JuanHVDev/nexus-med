import { prisma } from "@/lib/prisma"

export async function getUserClinic(userId: string) {
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

export async function getUserClinicId(userId: string): Promise<bigint | null> {
  const userClinic = await prisma.userClinic.findFirst({
    where: { userId },
    select: { clinicId: true },
    orderBy: { joinedAt: 'asc' },
  })
  
  return userClinic?.clinicId ?? null
}

export async function getUserRole(userId: string): Promise<string | null> {
  const userClinic = await prisma.userClinic.findFirst({
    where: { userId },
    select: { role: true },
    orderBy: { joinedAt: 'asc' },
  })
  
  return userClinic?.role ?? null
}
