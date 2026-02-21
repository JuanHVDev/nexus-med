import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import {
  getCachedDashboardStats,
  setCachedDashboardStats,
} from '@/lib/cache'
import { isRedisConfigured } from '@/lib/redis'

interface DashboardStats {
  totalPatients: number
  appointmentsToday: number
  totalMedicalNotes: number
  monthlyRevenue: bigint
  pendingAppointments: number
}

async function fetchDashboardStatsFromDB(clinicId: bigint): Promise<DashboardStats> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [
    totalPatients,
    appointmentsToday,
    totalMedicalNotes,
    monthlyRevenue,
    pendingAppointments
  ] = await Promise.all([
    prisma.patient.count({
      where: { clinicId, isActive: true }
    }),
    prisma.appointment.count({
      where: {
        clinicId,
        startTime: {
          gte: today,
          lt: tomorrow
        }
      }
    }),
    prisma.medicalNote.count({
      where: { clinicId }
    }),
    prisma.invoice.aggregate({
      where: {
        clinicId,
        status: 'PAID',
        issueDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1)
        }
      },
      _sum: { total: true }
    }),
    prisma.appointment.count({
      where: {
        clinicId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        startTime: { gte: today }
      }
    })
  ])

  return {
    totalPatients,
    appointmentsToday,
    totalMedicalNotes,
    monthlyRevenue: monthlyRevenue._sum.total ? BigInt(monthlyRevenue._sum.total.toString()) : BigInt(0),
    pendingAppointments
  }
}

export const getDashboardStats = cache(async (clinicId: bigint): Promise<DashboardStats> => {
  if (isRedisConfigured()) {
    const cached = await getCachedDashboardStats(clinicId)
    if (cached) {
      return cached
    }
  }

  const stats = await fetchDashboardStatsFromDB(clinicId)

  if (isRedisConfigured()) {
    await setCachedDashboardStats(clinicId, stats)
  }

  return stats
})
