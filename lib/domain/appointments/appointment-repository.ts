import { prisma } from "@/lib/prisma"
import type { 
  AppointmentFilter, 
  AppointmentWithRelations, 
  AppointmentRepository,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  ConflictCheckInput,
  AppointmentStatus
} from "./types"

function mapAppointmentToResponse(apt: {
  id: bigint
  clinicId: bigint
  patientId: bigint
  doctorId: string
  startTime: Date
  endTime: Date
  status: string
  reason: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  patient: {
    id: bigint
    firstName: string
    lastName: string
    middleName: string | null
    phone: string | null
  }
  doctor: {
    id: string
    name: string
    specialty: string | null
  }
  medicalNote?: { id: bigint } | null
}): AppointmentWithRelations {
  return {
    id: apt.id,
    clinicId: apt.clinicId,
    patientId: apt.patientId,
    doctorId: apt.doctorId,
    startTime: apt.startTime,
    endTime: apt.endTime,
    status: apt.status as AppointmentStatus,
    reason: apt.reason,
    notes: apt.notes,
    createdAt: apt.createdAt,
    updatedAt: apt.updatedAt,
    patient: apt.patient,
    doctor: apt.doctor,
    medicalNote: apt.medicalNote,
  }
}

export const appointmentRepository: AppointmentRepository = {
  async findById(id, clinicId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id, clinicId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            phone: true,
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
            licenseNumber: true,
          }
        },
        medicalNote: {
          select: { id: true }
        }
      }
    })

    if (!appointment) return null
    return mapAppointmentToResponse(appointment)
  },

  async findMany(filter, page, limit) {
    const where: Record<string, unknown> = {
      clinicId: filter.clinicId,
    }

    if (filter.doctorId) where.doctorId = filter.doctorId
    if (filter.patientId) where.patientId = filter.patientId
    if (filter.status) where.status = filter.status
    if (filter.startDate || filter.endDate) {
      where.startTime = {}
      if (filter.startDate) (where.startTime as Record<string, Date>).gte = filter.startDate
      if (filter.endDate) (where.startTime as Record<string, Date>).lte = filter.endDate
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startTime: 'asc' },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
              phone: true,
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialty: true,
            }
          }
        }
      }),
      prisma.appointment.count({ where })
    ])

    return {
      appointments: appointments.map(mapAppointmentToResponse),
      total
    }
  },

  async findForCalendar(clinicId, start, end, doctorId) {
    const where: Record<string, unknown> = {
      clinicId,
      startTime: {
        gte: start,
        lte: end
      }
    }

    if (doctorId) where.doctorId = doctorId

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            phone: true,
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          }
        }
      }
    })

    return appointments.map(mapAppointmentToResponse)
  },

  async findConflicting(params) {
    const { doctorId, startTime, endTime, excludeAppointmentId, clinicId } = params

    const where: Record<string, unknown> = {
      doctorId,
      clinicId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } }
          ]
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } }
          ]
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } }
          ]
        }
      ]
    }

    if (excludeAppointmentId) {
      where.id = { not: excludeAppointmentId }
    }

    const appointment = await prisma.appointment.findFirst({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            phone: true,
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          }
        }
      }
    })

    return appointment ? mapAppointmentToResponse(appointment) : null
  },

  async create(data) {
    const appointment = await prisma.appointment.create({
      data: {
        clinicId: data.clinicId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
        reason: data.reason,
        notes: data.notes,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            phone: true,
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          }
        }
      }
    })

    return mapAppointmentToResponse(appointment)
  },

  async update(id, data) {
    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            phone: true,
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          }
        }
      }
    })

    return mapAppointmentToResponse(appointment)
  },

  async updateStatus(id, status) {
    await prisma.appointment.update({
      where: { id },
      data: { status }
    })
  },

  async delete(id) {
    await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" }
    })
  }
}
